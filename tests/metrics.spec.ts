import { test, expect } from "@playwright/test";

test("metrics page shows instrument panels and a drawn sparkline", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.scrollTo({ top: 3 * window.innerHeight, behavior: "instant" }));
  await expect(page.locator('[data-page="metrics"]')).toBeVisible();
  await expect(page.locator(".metric-value").first()).toContainText("99.95");

  const lit = await page.locator("canvas.sparkline").evaluate((canvas) => {
    const c = canvas as HTMLCanvasElement;
    const ctx = c.getContext("2d")!;
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    let pixels = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) pixels++;
    return pixels;
  });
  expect(lit).toBeGreaterThan(500);

  await expect(page.locator(".led")).toBeVisible();
});

test("led does not pulse under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => window.scrollTo({ top: 3 * window.innerHeight, behavior: "instant" }));
  const animated = await page.locator(".led").evaluate((el) => {
    return getComputedStyle(el).animationName !== "none";
  });
  expect(animated).toBe(false);
});