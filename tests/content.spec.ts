import { test, expect } from "@playwright/test";

test("each of the six routes renders its own content", async ({ page }) => {
  const routes = [
    { path: "/", marker: "Senior DevOps/SRE Engineer" },
    { path: "/experience", marker: "EXPERIENCE" },
    { path: "/platform", marker: "PLATFORM" },
    { path: "/projects", marker: "PROJECTS" },
    { path: "/metrics", marker: "METRICS" },
    { path: "/contact", marker: "CONTACT" },
  ];
  for (const route of routes) {
    await page.goto(route.path);
    await expect(page.locator(`[data-page="${route.path === "/" ? "home" : route.path.slice(1)}"]`)).toBeVisible();
    await expect(page.locator("body")).toContainText(route.marker);
  }
});

test("hub navigation lands on real content, not 404", async ({ page }) => {
  await page.goto("/");
  const frame = page.frames().find((f) => f.url().startsWith("about:srcdoc"));
  await frame!.evaluate(() => {
    const c = document.querySelector("canvas") as HTMLCanvasElement;
    c.dispatchEvent(
      new MouseEvent("click", {
        clientX: Math.min(window.innerWidth * 0.88, window.innerWidth),
        clientY: window.innerHeight * 0.26,
        bubbles: true,
      }),
    );
  });
  await page.waitForURL("**/projects", { timeout: 10_000 });
  await expect(page.locator('[data-page="projects"]')).toBeVisible();
});