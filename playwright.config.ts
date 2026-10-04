import { defineConfig, devices } from "@playwright/test";

/**
 * Critical end-to-end flows against a production build.
 *   1. npm run db:reset   (seeded demo data + admin from .env)
 *   2. npm run build
 *   3. npm run test:e2e
 * A test Pixel ID is injected so tracking can be asserted; fbevents.js is blocked in the tests.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "ar-IQ",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
  ],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}`,
      // Runtime pixel id so tracking can be asserted (fbevents.js itself is blocked in the tests)
      META_PIXEL_ID: process.env.META_PIXEL_ID || "1234567890123456",
    },
  },
});
