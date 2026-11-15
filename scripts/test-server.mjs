import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

// Each test run gets its own database, separate from patient and preview records.
const dataDir = mkdtempSync(path.join(tmpdir(), "medistock-e2e-"));
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--port",
    "3100",
    "--hostname",
    "127.0.0.1",
  ],
  {
    stdio: "inherit",
    env: { ...process.env, HOSPITAL_DATA_DIR: dataDir },
  },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => {
  rmSync(dataDir, { recursive: true, force: true });
  process.exit(code || 0);
});
