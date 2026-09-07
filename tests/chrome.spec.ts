import { test, expect } from "@playwright/test";

test("no nav row in the header on desktop or mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".site-nav")).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".site-nav")).toHaveCount(0);
});

test("brand link scrolls back to home from another page", async ({ page }) => {
  await page.goto("/#/platform");
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(3 * 900);
  await page.locator(".site-name").click();
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);
  await expect(page.locator(".site-name")).toBeVisible();
});

test("no horizontal overflow at mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});