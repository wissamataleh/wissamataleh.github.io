import { test, expect } from "@playwright/test";

test("constellation keeps running across navigation (iframe not recreated)", async ({ page }) => {
  await page.goto("/");
  const frame = page.frames().find((f) => f.url().startsWith("about:srcdoc"));
  expect(frame).toBeTruthy();
  await frame!.evaluate(() => {
    (window as any).__CF_NONCE = "persist-me";
  });

  await frame!.evaluate(() => {
    const c = document.querySelector("canvas") as HTMLCanvasElement;
    const refs = (window as any).__CF_HUB_HREFS as string[];
    const pos = (window as any).__CF_HUB_POS as [number, number][];
    const i = refs.indexOf("/contact");
    c.dispatchEvent(
      new MouseEvent("click", {
        clientX: pos[i][0],
        clientY: pos[i][1],
        bubbles: true,
      }),
    );
  });
  await page.waitForURL("**/contact", { timeout: 10_000 });
  await expect(page.locator('[data-page="contact"]')).toBeVisible();

  const frameAfter = page.frames().find((f) => f.url().startsWith("about:srcdoc"));
  expect(frameAfter).toBeTruthy();
  const nonce = await frameAfter!.evaluate(() => (window as any).__CF_NONCE ?? null);
  expect(nonce).toBe("persist-me");
});

test("mode persists across hub navigation", async ({ page }) => {
  await page.goto("/experience");
  await page.getByRole("button", { name: "LIGHT" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-site-mode", "light");

  const frame = page.frames().find((f) => f.url().startsWith("about:srcdoc"));
  await frame!.evaluate(() => {
    const c = document.querySelector("canvas") as HTMLCanvasElement;
    const refs = (window as any).__CF_HUB_HREFS as string[];
    const pos = (window as any).__CF_HUB_POS as [number, number][];
    const i = refs.indexOf("/platform");
    c.dispatchEvent(
      new MouseEvent("click", {
        clientX: pos[i][0],
        clientY: pos[i][1],
        bubbles: true,
      }),
    );
  });
  await page.waitForURL("**/platform", { timeout: 10_000 });
  await expect(page.locator("html")).toHaveAttribute("data-site-mode", "light");
});

test("reduced motion freezes the field but menu still renders", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const frame = page.frames().find((f) => f.url().startsWith("about:srcdoc"));
  expect(frame).toBeTruthy();
  const hubCount = await frame!.evaluate(() => (window as any).__CF_HUB_COUNT ?? -1);
  expect(hubCount).toBe(6);
  await page.waitForTimeout(400);
  const a = await frame!.evaluate(() =>
    (document.querySelector("canvas") as HTMLCanvasElement).toDataURL(),
  );
  await page.waitForTimeout(300);
  const b = await frame!.evaluate(() =>
    (document.querySelector("canvas") as HTMLCanvasElement).toDataURL(),
  );
  expect(a).toBe(b);
});

test("no console or page errors across all routes", async ({ page }) => {
  const routes = ["/", "/experience", "/platform", "/projects", "/metrics", "/contact"];
  for (const route of routes) {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(route);
    await page.waitForTimeout(250);
    expect(errors, `route ${route}`).toEqual([]);
  }
});