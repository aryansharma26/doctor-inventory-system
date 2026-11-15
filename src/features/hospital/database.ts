import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { seedHospital } from "./seed";
import type { HospitalState } from "./types";

export const isDemo = () =>
  process.env.NODE_ENV !== "production" ||
  process.env.HOSPITAL_DEMO_MODE === "1";
let connection: DatabaseSync | undefined;
export function hospitalDb() {
  if (connection) return connection;
  const dir =
    process.env.HOSPITAL_DATA_DIR || path.join(process.cwd(), ".data");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  connection = new DatabaseSync(path.join(dir, "hospital.sqlite"));
  connection.exec(
    "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS hospital(id INTEGER PRIMARY KEY,state TEXT NOT NULL); CREATE TABLE IF NOT EXISTS config(key TEXT PRIMARY KEY,value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS staff(id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE,name TEXT NOT NULL,role TEXT NOT NULL,doctor_id TEXT,password_hash TEXT NOT NULL);",
  );
  connection
    .prepare("INSERT OR IGNORE INTO hospital(id,state) VALUES(1,?)")
    .run(
      JSON.stringify(
        isDemo()
          ? seedHospital()
          : {
              patients: [],
              visits: [],
              medicines: [],
              messages: [],
              invoices: [],
            },
      ),
    );
  connection
    .prepare("INSERT OR IGNORE INTO config(key,value) VALUES('secret',?)")
    .run(randomBytes(48).toString("hex"));
  return connection;
}
export function readState(): HospitalState {
  const state = JSON.parse(
    (
      hospitalDb().prepare("SELECT state FROM hospital WHERE id=1").get() as {
        state: string;
      }
    ).state,
  );
  return {
    ...state,
    messages: state.messages || [],
    invoices: state.invoices || [],
  };
}
export function sessionSecret() {
  return (
    hospitalDb()
      .prepare("SELECT value FROM config WHERE key='secret'")
      .get() as { value: string }
  ).value;
}
