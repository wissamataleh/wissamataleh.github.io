import { test, expect } from "@playwright/test";

const SECTIONS = [
  { id: "home", marker: "Senior DevOps/SRE Engineer" },
  { id: "experience", marker: "02 / EXPERIENCE" },
  { id: "platform", marker: "03 / PLATFORM" },
  { id: "metrics", marker: "04 / METRICS" },
  { id: "contact", marker: "05 / CONTACT" },
  { id: "projects", marker: "06 / PROJECTS" },
];

test("all six pages render as sections of the deck on the index route", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".deck-page")).toHaveCount(6);
  for (const s of SECTIONS) {
    await expect(page.locator(`.deck-page[data-page="${s.id}"]`)).toContainText(s.marker);
  }
});

test("clicking the projects hub scrolls the projects page into view", async ({ page }) => {
  await page.goto("/");
  const frame = page.frames().find((f) => f.url().startsWith("about:srcdoc"));
  expect(frame).toBeTruthy();
  await frame!.evaluate(() => {
    const c = document.querySelector("canvas") as HTMLCanvasElement;
    const refs = (window as any).__CF_HUB_HREFS as string[];
    const pos = (window as any).__CF_HUB_POS as [number, number][];
    const i = refs.indexOf("/projects");
    c.dispatchEvent(
      new MouseEvent("click", {
        clientX: pos[i][0],
        clientY: pos[i][1],
        bubbles: true,
      }),
    );
  });
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(5 * 900);
  await expect(page.locator('[data-page="projects"]')).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/");
});

test("wheel over the empty field area scrolls the deck", async ({ page }) => {
  await page.goto("/");
  await page.mouse.move(1150, 450);
  await page.mouse.wheel(0, 420);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

test("a panel taller than the viewport scrolls internally without moving the deck", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto("/");
  await page.evaluate(() => window.scrollTo({ top: 1 * window.innerHeight, behavior: "instant" }));
  await page.mouse.move(220, 300);
  await page.mouse.wheel(0, 240);
  const panel = page.locator('.deck-page[data-page="experience"] .content-panel');
  await expect
    .poll(async () => panel.evaluate((el) => (el as HTMLElement).scrollTop))
    .toBeGreaterThan(0);
  expect(await page.evaluate(() => Math.round(window.scrollY / window.innerHeight))).toBe(1);
});

