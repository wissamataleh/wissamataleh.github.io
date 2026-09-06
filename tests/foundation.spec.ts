import { test, expect } from "@playwright/test";

test("effect renders and draws pixels inside the sandboxed iframe", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));

  await page.goto("/");

  const frame = page.frameLocator('iframe[title="Constellation Field"]');
  const canvas = frame.locator("canvas#constellationCanvas");
  await expect(canvas).toBeVisible();

  const frameHandle = page.frames().find((f) => f.url().startsWith("about:srcdoc"));
  expect(frameHandle).toBeTruthy();
  const pixels = await frameHandle!.evaluate(() => {
    const c = document.querySelector("canvas") as HTMLCanvasElement | null;
    if (!c) return 0;
    const ctx = c.getContext("2d")!;
    const data = ctx.getImageData(0, 0, c.width, Math.min(400, c.height)).data;
    let lit = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) lit++;
    return lit;
  });
  expect(pixels).toBeGreaterThan(1000);
  expect(errors).toEqual([]);
});

test("dev-build artifacts exist", async () => {
  const { execSync } = await import("node:child_process");
  const files = String(execSync("ls dist")).split("\n");
  expect(files.some((f) => f.startsWith("index"))).toBe(true);
});
