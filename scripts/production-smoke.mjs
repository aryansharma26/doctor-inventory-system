import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";

const dir = mkdtempSync(path.join(tmpdir(), "medistock-production-test-"));
const password = randomBytes(24).toString("hex");
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--port",
    "3101",
    "--hostname",
    "127.0.0.1",
  ],
  {
    env: {
      ...process.env,
      HOSPITAL_DATA_DIR: dir,
      HOSPITAL_DEMO_MODE: "0",
      HOSPITAL_ADMIN_PASSWORD: password,
      HOSPITAL_RECEPTION_PASSWORD: password,
    },
    stdio: "ignore",
  },
);
const base = "http://127.0.0.1:3101";
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`${base}/api/staff`)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await delay(200);
  }
  assert(
    ready,
    "Production server did not become ready; run npm run build first.",
  );
  assert.equal((await fetch(`${base}/api/hospital`)).status, 401);
  const session = await (await fetch(`${base}/api/staff`)).json();
  assert.equal(session.demo, false);
  assert.equal(session.role, null);
  const post = (route, data, cookie) =>
    fetch(base + route, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify(data),
    });
  assert.equal(
    (await post("/api/staff", { username: "admin", password: "incorrect" }))
      .status,
    401,
  );
  const login = await post("/api/staff", { username: "admin", password });
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie").split(";")[0];
  assert(login.headers.get("set-cookie").includes("HttpOnly"));
  assert(login.headers.get("set-cookie").includes("Secure"));
  const state = await (
    await fetch(`${base}/api/hospital`, { headers: { Cookie: cookie } })
  ).json();
  assert.deepEqual(state, {
    patients: [],
    visits: [],
    medicines: [],
    messages: [],
    invoices: [],
  });
  assert.equal(
    (
      await fetch(`${base}/api/hospital`, {
        headers: { Cookie: "hospital_session=ADMIN.9999999999999.forged" },
      })
    ).status,
    401,
  );
  const receptionist = await post("/api/staff", {
    username: "reception",
    password,
  });
  const receptionCookie = receptionist.headers.get("set-cookie").split(";")[0];
  assert.equal(
    (
      await post(
        "/api/hospital",
        { action: "restock", medicineId: "med-1", quantity: 5 },
        receptionCookie,
      )
    ).status,
    403,
  );
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() + 86400000));
  const slots = await (
    await fetch(`${base}/api/booking?doctor=aarav&date=${day}`)
  ).json();
  assert(slots.slots.length > 0);
  console.log(
    "Production checks passed: unauthenticated access, password login, signed cookies, empty production database, role permissions and public slot availability.",
  );
} finally {
  if (server.exitCode === null && server.signalCode === null) {
    server.kill("SIGTERM");
    await new Promise((resolve) => server.once("exit", resolve));
  }
  rmSync(dir, { recursive: true, force: true });
}
