import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const APP_PORT = Number(process.env.E2E_APP_PORT ?? 3200);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "off" },
  webServer: [
    {
      command: `npx next start -p ${PORT}`,
      url: `http://localhost:${PORT}/api/health`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      // offline app bundle (requires `npm run build:app` first)
      command: `node scripts/serve-static.mjs out ${APP_PORT}`,
      url: `http://localhost:${APP_PORT}/`,
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
  projects: [
    { name: "desktop-chromium", testIgnore: /app-build/, use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-android", testIgnore: /app-build/, use: { ...devices["Pixel 7"] } },
    // iPhone viewport/UA/touch emulated on Chromium (WebKit engine not installed in CI image)
    { name: "mobile-iphone", testIgnore: /app-build/, use: { ...devices["iPhone 13"], browserName: "chromium" } },
    // the static, local-first bundle that ships inside the Android/iOS apps
    { name: "app-bundle", testMatch: /app-build/, use: { ...devices["Pixel 7"], baseURL: `http://localhost:${APP_PORT}` } },
  ],
});
