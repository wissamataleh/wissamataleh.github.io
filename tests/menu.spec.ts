import { test, expect } from "@playwright/test";

test("hub glyphs render and clicking a hub navigates without reload", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("/");
  const frame = page.frames().find((f) => f.url().startsWith("about:srcdoc"));
  expect(frame).toBeTruthy();

  const vp = page.viewportSize()!;

  const hoverBefore = await frame!.evaluate(
    () => (window as any).__CF_HOVER ?? null,
  );
  expect(hoverBefore).toBeNull();

  await page.mouse.move(vp.width * 0.12, vp.height * 0.5);
  await expect
    .poll(async () => frame!.evaluate(() => (window as any).__CF_HOVER ?? null))
    .toBe(1);

  await page.mouse.click(vp.width * 0.12, vp.height * 0.5);
  await page.waitForURL("**/experience", { timeout: 10_000 });
  expect(new URL(page.url()).pathname).toBe("/experience");
  expect(errors).toEqual([]);
});

test("dark/light toggle flips the field and persists across navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "LIGHT" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-site-mode", "light");

  const vp = page.viewportSize()!;
  await page.mouse.click(vp.width * 0.88, vp.height * 0.74);
  await page.waitForURL("**/contact", { timeout: 10_000 });
  await expect(page.locator("html")).toHaveAttribute("data-site-mode", "light");
});

test("hub clicks work on a retina canvas (devicePixelRatio 2)", async ({ browser }) => {
  const context = await browser.newContext({ deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto("/");
  const frame = page.frames().find((f) => f.url().startsWith("about:srcdoc"));
  expect(frame).toBeTruthy();

  const dpr = await frame!.evaluate(() => window.devicePixelRatio);
  expect(dpr).toBeGreaterThanOrEqual(2);

  const vp = page.viewportSize()!;
  await page.mouse.click(vp.width * 0.12, vp.height * 0.5);
  await page.waitForURL("**/experience", { timeout: 10_000 });
  expect(new URL(page.url()).pathname).toBe("/experience");
  await context.close();
});