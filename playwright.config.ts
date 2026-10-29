import fs from "node:fs";
import { defineConfig } from "@playwright/test";

delete process.env.NO_COLOR;

if (fs.existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 180 * 1000,
  expect: { timeout: 30 * 1000 },
  maxFailures: 1,
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "access",
      testMatch: /operator-access\.spec\.ts/,
      use: { storageState: { cookies: [], origins: [] } },
    },
    {
      name: "dashboard",
      testMatch: /dashboard-.*\.spec\.ts/,
      dependencies: ["setup"],
      use: { storageState: "e2e/.auth/operator.json" },
    },
  ],
});
