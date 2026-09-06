import { test, expect } from "@playwright/test";

test("suffixScript is injected and executes inside the frame", async ({ page }) => {
  await page.goto("/");
  const frame = page.frames().find((f) => f.url().startsWith("about:srcdoc"));
  expect(frame).toBeTruthy();
  const marker = await frame!.evaluate(() => (window as any).__SUFFIX_OK ?? null);
  expect(marker).toBe(7);
});