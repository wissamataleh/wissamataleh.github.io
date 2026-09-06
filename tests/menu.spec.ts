import { test, expect } from "@playwright/test";

async function hubPos(frame: any, path: string) {
  return frame.evaluate((p: string) => {
    const refs = (window as any).__CF_HUB_HREFS as string[];
    const pos = (window as any).__CF_HUB_POS as [number, number][];
    const i = refs.indexOf(p);
    return { x: pos[i][0], y: pos[i][1] };
  }, path);
}

test("hub glyphs render and clicking a hub navigates without reload", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("/");
  const frame = page.frames().find((f) => f.url().startsWith("about:srcdoc"));
  expect(frame).toBeTruthy();

  const hoverBefore = await frame!.evaluate(() => (window as any).__CF_HOVER ?? null);
  expect(hoverBefore).toBeNull();

  const exp = await hubPos(frame!, "/experience");

  await page.mouse.move(exp.x, exp.y);
  await expect
    .poll(async () => frame!.evaluate(() => (window as any).__CF_HOVER ?? null))
    .toBe(1);

  await page.mouse.click(exp.x, exp.y);
  await page.waitForURL("**/experience", { timeout: 10_000 });
  expect(new URL(page.url()).pathname).toBe("/experience");
  expect(errors).toEqual([]);
});

test("dark/light toggle flips the field and persists across navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "LIGHT" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-site-mode", "light");

  const frame = page.frames().find((f) => f.url().startsWith("about:srcdoc"));
  const contact = await hubPos(frame!, "/contact");
  await page.mouse.click(contact.x, contact.y);
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

  const exp = await hubPos(frame!, "/experience");
  await page.mouse.click(exp.x, exp.y);
  await page.waitForURL("**/experience", { timeout: 10_000 });
  expect(new URL(page.url()).pathname).toBe("/experience");
  await context.close();
});
