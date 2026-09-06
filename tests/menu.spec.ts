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

test("hovering and clicking a nav label (text) triggers hover glow and navigates", async ({
  page,
}) => {
  await page.goto("/");
  const frame = page.frames().find((f) => f.url().startsWith("about:srcdoc"));
  expect(frame).toBeTruthy();

  const labelRight = await frame!.evaluate(() => {
    const idx = (window as any).__CF_HUB_HREFS.indexOf("/platform");
    const pos = (window as any).__CF_HUB_POS as [number, number][];
    return { x: pos[idx][0] + 18, y: pos[idx][1] };
  });

  await page.mouse.move(labelRight.x, labelRight.y);
  await expect
    .poll(async () => frame!.evaluate(() => (window as any).__CF_HOVER ?? null))
    .toBe(2);

  await page.mouse.click(labelRight.x, labelRight.y);
  await page.waitForURL("**/platform", { timeout: 10_000 });
  expect(new URL(page.url()).pathname).toBe("/platform");
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

test("menu hubs are connected with constellation lines", async ({ page }) => {
  await page.goto("/");
  const frame = page.frames().find((f) => f.url().startsWith("about:srcdoc"));
  expect(frame).toBeTruthy();

  await expect
    .poll(
      async () =>
        frame!.evaluate(() => {
          const pos = (window as any).__CF_HUB_POS as [number, number][];
          if (!pos || !pos.length) return 0;
          let cx = 0, cy = 0;
          for (const p of pos) {
            cx += p[0];
            cy += p[1];
          }
          cx /= pos.length;
          cy /= pos.length;
          const c = document.querySelector("canvas") as HTMLCanvasElement;
          const ctx = c.getContext("2d")!;
          const scale = c.width / window.innerWidth;
          const px = cx * scale;
          const py = cy * scale;
          const w = c.width, h = c.height;
          const data = ctx.getImageData(0, 0, w, h).data;
          let count = 0;
          for (let dy = -70; dy <= 70; dy += 3) {
            for (let dx = -70; dx <= 70; dx += 3) {
              const x = Math.round(px + dx), y = Math.round(py + dy);
              if (x < 0 || y < 0 || x >= w || y >= h) continue;
              if (data[(y * w + x) * 4 + 3] > 0) count++;
            }
          }
          return count;
        }),
    )
    .toBeGreaterThan(5);
});
