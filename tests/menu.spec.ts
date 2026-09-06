import { test, expect } from "@playwright/test";

test("hub glyphs render and clicking a hub navigates without reload", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("/");
  const frame = page.frames().find((f) => f.url().startsWith("about:srcdoc"));
  expect(frame).toBeTruthy();

  const hubCount = await frame!.evaluate(() => (window as any).__CF_HUB_COUNT ?? -1);
  expect(hubCount).toBe(6);

  await frame!.evaluate(() => {
    const c = document.querySelector("canvas") as HTMLCanvasElement;
    c.dispatchEvent(
      new MouseEvent("click", {
        clientX: window.innerWidth * 0.12,
        clientY: window.innerHeight * 0.5,
        bubbles: true,
      }),
    );
  });
  await page.waitForURL("**/experience", { timeout: 10_000 });
  expect(new URL(page.url()).pathname).toBe("/experience");
  expect(errors).toEqual([]);
});

test("dark/light toggle flips the field and persists across navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "LIGHT" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-site-mode", "light");

  const frame = page.frames().find((f) => f.url().startsWith("about:srcdoc"));
  await frame!.evaluate(() => {
    const c = document.querySelector("canvas") as HTMLCanvasElement;
    c.dispatchEvent(
      new MouseEvent("click", {
        clientX: window.innerWidth * 0.88,
        clientY: window.innerHeight * 0.74,
        bubbles: true,
      }),
    );
  });
  await page.waitForURL("**/contact", { timeout: 10_000 });
  await expect(page.locator("html")).toHaveAttribute("data-site-mode", "light");
});