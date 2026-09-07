import { test, expect } from "@playwright/test";

test("impact page shows the impact stats grid and points", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.scrollTo({ top: 1 * window.innerHeight, behavior: "instant" }));
  await expect(page.locator('[data-page="impact"]')).toBeVisible();
  await expect(page.locator('.deck-page[data-page="impact"] .metric-grid')).toBeVisible();
  await expect(page.locator('.deck-page[data-page="impact"] .metric-label').first()).toHaveText("PROD CLUSTERS");
  await expect(page.locator('.deck-page[data-page="impact"] .role-points')).toBeVisible();
});

test("impact page renders without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/#/impact");
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(1 * 900);
  await expect(page.locator('[data-page="impact"]')).toBeVisible();
  expect(errors).toEqual([]);
});