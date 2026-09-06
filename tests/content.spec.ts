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
  await page.waitForURL("**/projects", { timeout: 10_000 });
  await expect(page.locator('[data-page="projects"]')).toBeVisible();
});