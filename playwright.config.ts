import { defineConfig, devices } from "@playwright/test";

// Smoke tests that drive the real app in a browser.
//
//   npm run test:e2e            run everything (starts the dev server on port 5373)
//   npx playwright test --ui    watch it work
//
// Public page tests run anywhere. Signed in tests (journal, lessons) need the
// test accounts, which e2e/global-setup.ts prepares with the service role key
// from .env.local; without that key (for example in CI) they are skipped.
//
// Locally it uses the Chrome already installed on your computer. In CI it uses
// the Chromium that `npx playwright install chromium` downloads.
const channel = process.env.CI ? undefined : "chrome";
const PORT = 5373;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  // Signed in tests share two test accounts, so run one file at a time.
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel }, testIgnore: /phone/ },
    // 375 px is the narrowest phone the launch checklist covers.
    { name: "phone", use: { ...devices["Desktop Chrome"], channel, viewport: { width: 375, height: 812 } }, testMatch: /phone/ },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // The app needs these to start; public pages never call the database, so any values work in CI.
    env: process.env.CI
      ? { VITE_SUPABASE_URL: "https://example.supabase.co", VITE_SUPABASE_ANON_KEY: "ci-placeholder-key" }
      : {},
  },
});
