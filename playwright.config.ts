import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  fullyParallel: false,
  use: {
    baseURL: "http://localhost:8765",
    viewport: { width: 1440, height: 900 },
    browserName: "chromium",
  },
  webServer: {
    command: "npm run build && npx serve dist -p 8765 --no-clipboard",
    url: "http://localhost:8765",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
