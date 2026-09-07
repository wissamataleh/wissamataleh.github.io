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
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(4 * 900);

  const frameAfter = page.frames().find((f) => f.url().startsWith("about:srcdoc"));
  expect(frameAfter).toBeTruthy();
  const nonce = await frameAfter!.evaluate(() => (window as any).__CF_NONCE ?? null);
  expect(nonce).toBe("persist-me");
});

test("mode persists when scrolling between pages", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "LIGHT" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-site-mode", "light");
  await page.evaluate(() => window.scrollTo({ top: 2 * window.innerHeight, behavior: "instant" }));
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

test("no console or page errors across the deck while scrolling", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/");
  for (let i = 0; i < 6; i++) {
    await page.evaluate((n) => window.scrollTo({ top: n * window.innerHeight, behavior: "instant" }), i);
    await page.waitForTimeout(100);
  }
  expect(errors).toEqual([]);
});
