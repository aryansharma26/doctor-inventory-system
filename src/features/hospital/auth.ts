import "server-only";
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { hospitalDb, isDemo, sessionSecret } from "./database";
import { HospitalError } from "./errors";
import type { Role, StaffSession } from "./types";

type StaffRow = {
  id: string;
  username: string;
  name: string;
  role: Role;
  doctor_id: string | null;
  password_hash: string;
};
let accountsReady = false;
function matches(password: string, encoded: string) {
  const [salt, hash] = encoded.split(":");
  if (!salt || !hash) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function accounts() {
  const db = hospitalDb();
  if (accountsReady) return db;
  const definitions = [
    {
      id: "admin",
      name: "Hospital administrator",
      role: "ADMIN",
      doctor: null,
      password: "Admin@123",
      env: "ADMIN",
    },
    {
      id: "reception",
      name: "Reception desk",
      role: "RECEPTION",
      doctor: null,
      password: "Reception@123",
      env: "RECEPTION",
    },
    {
      id: "doctor",
      name: "Dr. Aarav Sharma",
      role: "DOCTOR",
      doctor: "aarav",
      password: "Doctor@123",
      env: "DOCTOR",
    },
    {
      id: "doctor.meera",
      name: "Dr. Meera Kapoor",
      role: "DOCTOR",
      doctor: "meera",
      password: "Doctor@123",
      env: "MEERA",
    },
    {
      id: "doctor.rohan",
      name: "Dr. Rohan Verma",
      role: "DOCTOR",
      doctor: "rohan",
      password: "Doctor@123",
      env: "ROHAN",
    },
    {
      id: "pharmacy",
      name: "Pharmacy counter",
      role: "PHARMACY",
      doctor: null,
      password: "Pharmacy@123",
      env: "PHARMACY",
    },
  ];
  for (const user of definitions) {
    const password =
      process.env[`HOSPITAL_${user.env}_PASSWORD`] ||
      (isDemo() ? user.password : "");
    if (!password) continue;
    const username = (
      process.env[`HOSPITAL_${user.env}_LOGIN`] || user.id
    ).toLowerCase();
    const current = db
      .prepare("SELECT * FROM staff WHERE id=?")
      .get(user.id) as StaffRow | undefined;
    if (
      current &&
      current.username === username &&
      matches(password, current.password_hash)
    )
      continue;
    const salt = randomBytes(16).toString("hex");
    const hash = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
    db.prepare(
      "INSERT INTO staff(id,username,name,role,doctor_id,password_hash) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET username=excluded.username,password_hash=excluded.password_hash",
    ).run(user.id, username, user.name, user.role, user.doctor || "", hash);
  }
  accountsReady = true;
  return db;
}
const visible = (row: StaffRow): StaffSession => ({
  id: row.id,
  username: row.username,
  name: row.name,
  role: row.role,
  doctorId: row.doctor_id || null,
});
function signature(payload: string, row: StaffRow) {
  return createHmac("sha256", sessionSecret())
    .update(`${payload}.${row.password_hash}`)
    .digest("hex");
}
function configured(row: StaffRow) {
  const key = (
    {
      admin: "ADMIN",
      reception: "RECEPTION",
      doctor: "DOCTOR",
      "doctor.meera": "MEERA",
      "doctor.rohan": "ROHAN",
      pharmacy: "PHARMACY",
    } as Record<string, string>
  )[row.id];
  return isDemo() || !!(key && process.env[`HOSPITAL_${key}_PASSWORD`]);
}
export async function getStaffSession(): Promise<StaffSession | null> {
  const token = (await cookies()).get("hospital_session")?.value;
  if (!token) return null;
  const parts = token.split("|");
  if (parts.length !== 3) return null;
  const [id, expires, sig] = parts;
  if (
    !/^\d{13}$/.test(expires) ||
    Number(expires) < Date.now() ||
    !/^[a-f0-9]{64}$/.test(sig)
  )
    return null;
  const row = accounts().prepare("SELECT * FROM staff WHERE id=?").get(id) as
    StaffRow | undefined;
  if (!row || !configured(row)) return null;
  const expected = signature(`${id}|${expires}`, row);
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ? visible(row)
    : null;
}
export async function sessionRole() {
  return (await getStaffSession())?.role || null;
}
export async function requireStaff(
  roles: Role[] = ["ADMIN", "RECEPTION", "DOCTOR", "PHARMACY"],
) {
  const staff = await getStaffSession();
  if (!staff)
    throw new HospitalError(
      "Please sign in with your staff ID and password.",
      401,
    );
  if (!roles.includes(staff.role))
    throw new HospitalError(
      "This action is not available to your department.",
      403,
    );
  return staff;
}
export async function requireRole(roles: Role[]) {
  return (await requireStaff(roles)).role;
}
export async function signInStaff(username: string, password: string) {
  const row = accounts()
    .prepare("SELECT * FROM staff WHERE username=?")
    .get(username.trim().toLowerCase()) as StaffRow | undefined;
  if (!row || !configured(row)) {
    scryptSync(password, "unknown-account", 64);
    throw new HospitalError("Incorrect staff ID or password.", 401);
  }
  if (!matches(password, row.password_hash))
    throw new HospitalError("Incorrect staff ID or password.", 401);
  const payload = `${row.id}|${Date.now() + 8 * 3600000}`;
  (await cookies()).set(
    "hospital_session",
    `${payload}|${signature(payload, row)}`,
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 3600,
      path: "/",
    },
  );
  return visible(row);
}
