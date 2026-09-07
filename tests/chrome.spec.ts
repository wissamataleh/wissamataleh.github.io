import { test, expect } from "@playwright/test";

test("nav row is hidden on desktop, visible with links on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const navRow = page.locator(".site-nav");
  await expect(navRow).toBeHidden();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(navRow).toBeVisible();
  await expect(navRow.locator("a")).toHaveCount(6);

  await navRow.locator('a[href="#/experience"]').click();
  expect(new URL(page.url()).pathname).toBe("/");
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(844);
  await expect.poll(() => page.evaluate(() => new URL(location.href).hash)).toBe("#/experience");
  await expect(page.locator("a.is-active[href='#/experience']")).toHaveCount(1);
});

test("brand link scrolls back to home from another page", async ({ page }) => {
  await page.goto("/#/platform");
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(2 * 900);
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