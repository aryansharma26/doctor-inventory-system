import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  fullyParallel: false,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3100",
    browserName: "webkit",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/test-server.mjs",
    url: "http://127.0.0.1:3100/api/staff",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
