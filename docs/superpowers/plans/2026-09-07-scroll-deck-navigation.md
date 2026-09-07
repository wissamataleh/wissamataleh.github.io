# Scroll-Deck Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the six-route Astro portfolio into a single scrollable deck on `/` where scrolling moves from page to page (proximity-snapped, hash-tracked) while the fixed constellation remains the visual nav that scrolls to each page.

**Architecture:** One route (`.deck-page` sections stacked, each exactly `100vh`, `scroll-snap-align: start`). The document is the scroller (`html { scroll-snap-type: y proximity }`); each section's `.content-panel` keeps its own internal `overflow-y: auto` scroller. `ConstellationMenu.tsx` runs a scroll-spy (scrollTop / innerHeight), updates `#/experience`-style hash (`pushState` on hub/link navigation, `replaceState` while scrolling), posts `{type:'constellation-route', href}` to the iframe so the RUNTIME lights the current hub, and answers hub/link clicks with `window.scrollTo`. Astro View Transitions/`navigate` and the block `js-reveal` animation are removed.

**Tech Stack:** Astro 5, React island (ConstellationMenu), Canvas-2D + Raw WebGL effect (authored HTML, never edited), Playwright, `serve` static preview on :8765.

**Spec:** `docs/superpowers/specs/2026-09-07-scroll-deck-navigation-design.md` — the plan argues from the spec; executors read both.

## Global Constraints

- Never edit the 8 authored effect `.html` sources — `npm run verify` (hashes) must stay green.
- No comments in source code (existing convention).
- Conventional commits, one per task.
- Every task ends with a passing targeted test; the full suite must be green at the end.
- Allowed diagnostics: `npm run check`, `npm test`, `npm run verify`, `npx oxlint` (only known benign `react(only-export-components)` warning tolerated).
- Does not depend on anything new — no new dependencies.
- `NAV_SECTIONS` order from `src/components/menu/menuScript.ts` is the single source of truth for deck order and index mapping (index = position in `NAV_SECTIONS`):
  - 0 `home` `/`, 1 `experience` `/experience`, 2 `platform` `/platform`, 3 `metrics` `/metrics`, 4 `contact` `/contact`, 5 `projects` `/projects`.
- Playwright default viewport is 1440x900 in `playwright.config.ts`; `innerHeight` in tests is therefore 900 unless a test changes the viewport.
- Hash format: `#/experience` (i.e. `"#" + href`).
- The standalone route URLs (`/experience`, `/platform`, `/metrics`, `/contact`, `/projects`) are deleted and must not be used in tests or links.

---

### Task 1: Deck markup, route cleanup, scroll foundation, hub-click scrolls

**Files:**
- Rewrite: `src/pages/index.astro`
- Delete: `src/pages/experience.astro`, `src/pages/platform.astro`, `src/pages/metrics.astro`, `src/pages/contact.astro`, `src/pages/projects.astro`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/components/ConstellationMenu.tsx`
- Modify: `src/styles/global.css`
- Test: `tests/content.spec.ts`, `tests/metrics.spec.ts`, `tests/regression.spec.ts`, `tests/chrome.spec.ts`, `tests/menu.spec.ts`

**Interfaces:**
- Consumes: `NAV_SECTIONS` (exported from `menuScript.ts`), `SITE/EXPERIENCE/SKILLS/PROJECTS/METRICS/CONTACT` from `src/data/site.ts`.
- Produces:
  - `.deck-page` sections on `/` with `data-page` = section id (home, experience, platform, metrics, contact, projects) and a `.content-panel` child.
  - Host scroll helper: `window.scrollTo({ top: i * window.innerHeight, behavior: prefersReducedMotion() ? "instant" : "smooth" })` (used by hub-click handler).
  - `#constellation-menu-root` island mounts with `client:load` only (no `transition:persist`).
  - Chrome links: `.site-name href="#/"`, `.site-nav a href="#/experience"` etc. (scroll handled in Task 3).

- [ ] **Step 1: Rewrite `src/pages/index.astro` as the deck**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import { SITE, EXPERIENCE, SKILLS, PROJECTS, METRICS, CONTACT } from "../data/site";
const seriesJson = JSON.stringify(METRICS.series);
---
<BaseLayout title={`${SITE.handle} — ${SITE.role}`}>
  <section class="deck-page" data-page="home">
    <article class="content-panel">
      <p class="kicker">SR0.OPERATOR // SUISSE</p>
      <h1>{SITE.role}</h1>
      <p class="tagline">{SITE.tagline}</p>
      <div class="hairline" />
      <dl class="stat-strip">
        <div><dt>ON-CALL</dt><dd>24 / 7 / 365</dd></div>
        <div><dt>INCIDENTS/CD</dt><dd>2.1</dd></div>
        <div><dt>SLO</dt><dd>99.95%</dd></div>
        <div><dt>MTTA</dt><dd>9m 40s</dd></div>
      </dl>
      <p class="hint">SCROLL TO NAVIGATE — OR AIM &amp; CLICK A NODE.</p>
    </article>
  </section>

  <section class="deck-page" data-page="experience">
    <section class="content-panel">
      <p class="kicker">02 / EXPERIENCE</p>
      {EXPERIENCE.map((role) => (
        <article class="role">
          <div class="role-head">
            <h2>{role.title}</h2>
            <p class="role-meta">{role.company} — {role.period}</p>
            <p class="role-stack">{role.stack.join(" / ")}</p>
          </div>
          <ul class="role-points">
            {role.points.map((point) => (
              <li>{point}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  </section>

  <section class="deck-page" data-page="platform">
    <section class="content-panel">
      <p class="kicker">03 / PLATFORM &amp; SKILLS</p>
      {SKILLS.map((group) => (
        <div class="skill-group">
          <h2>{group.name}</h2>
          <ul class="skill-tags">
            {group.tags.map((tag) => (
              <li>{tag}</li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  </section>

  <section class="deck-page" data-page="metrics">
    <section class="content-panel">
      <p class="kicker">04 / METRICS — LIVE FEED SNAPSHOT</p>
      <div class="metric-grid">
        <div class="metric-cell metric-cell-wide">
          <span class="metric-label">SLO (30 DAYS)</span>
          <span class="metric-value metric-hero">{METRICS.slo}%</span>
          <div class="burn-bar" style={`--burn: ${METRICS.errorBudgetRemaining}%`}>
            <div class="burn-fill" />
          </div>
          <span class="metric-note">ERROR BUDGET USED {METRICS.errorBudgetRemaining}%</span>
        </div>
        <div class="metric-cell">
          <span class="metric-label">UPTIME NOW</span>
          <span class="metric-value">{METRICS.uptimeNow}%</span>
          <span class="led" aria-hidden="true" />
        </div>
        <div class="metric-cell">
          <span class="metric-label">P99 / P95</span>
          <span class="metric-value">{METRICS.p99}</span>
          <span class="metric-note">P95 {METRICS.p95}</span>
        </div>
        <div class="metric-cell">
          <span class="metric-label">REQUEST RATE</span>
          <span class="metric-value">{METRICS.reqRate}</span>
        </div>
      </div>
      <div class="metric-grid">
        <div class="metric-cell metric-cell-wide">
          <span class="metric-label">REQ/S — 30 DAY TRAIL</span>
          <canvas class="sparkline" width="360" height="96" data-series={seriesJson} />
        </div>
      </div>
    </section>
  </section>

  <section class="deck-page" data-page="contact">
    <section class="content-panel">
      <p class="kicker">05 / CONTACT</p>
      <p class="tagline">{CONTACT.availability}</p>
      <dl class="contact-list">
        <div><dt>EMAIL</dt><dd><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></dd></div>
        <div><dt>GITHUB</dt><dd><a href={CONTACT.github} target="_blank" rel="noreferrer">{CONTACT.github}</a></dd></div>
        <div><dt>LINKEDIN</dt><dd><a href={CONTACT.linkedin} target="_blank" rel="noreferrer">{CONTACT.linkedin}</a></dd></div>
      </dl>
    </section>
  </section>

  <section class="deck-page" data-page="projects">
    <section class="content-panel">
      <p class="kicker">06 / PROJECTS</p>
      {PROJECTS.map((project) => (
        <article class="project">
          <div class="project-head">
            <h2>{project.name}</h2>
            <span class="project-status">{project.status}</span>
          </div>
          <p class="project-summary">{project.summary}</p>
          <p class="project-stack">{project.stack.join(" / ")}</p>
        </article>
      ))}
    </section>
  </section>
</BaseLayout>

<script>
  const canvas = document.querySelector<HTMLCanvasElement>("canvas.sparkline");
  if (canvas) {
    const series = JSON.parse(canvas.dataset.series || "[]") as number[];
    const rect = (n: number) => canvas.height - (n / 40) * canvas.height;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "currentColor";
    ctx.fillStyle = "currentColor";
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    series.forEach((n, i) => {
      const x = (i / (series.length - 1)) * canvas.width;
      if (i === 0) ctx.moveTo(x, rect(n));
      else ctx.lineTo(x, rect(n));
    });
    ctx.stroke();
    ctx.globalAlpha = 0.35;
    series.forEach((n, i) => {
      const x = (i / (series.length - 1)) * canvas.width;
      ctx.fillRect(x - 1, rect(n) - 1, 2, 2);
    });
  }
</script>
```

- [ ] **Step 2: Delete the five route pages**

```bash
git rm src/pages/experience.astro src/pages/platform.astro src/pages/metrics.astro src/pages/contact.astro src/pages/projects.astro
```

- [ ] **Step 3: Update `src/layouts/BaseLayout.astro`**

Remove the `<ClientRouter />` import and element, remove the `js-reveal` `<script>`, and drop `transition:persist`:

```astro
---
import "../styles/global.css";
import ConstellationMenu from "../components/ConstellationMenu";

interface Props {
  title?: string;
}

const { title = "Senior DevOps/SRE Engineer" } = Astro.props;
---
<!doctype html>
<html lang="en" data-site-mode="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark light" />
    <meta name="description" content="Senior DevOps/SRE Engineer — portfolio" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
  </head>
  <body>
    <ConstellationMenu client:load />
    <main class="site-content">
      <slot />
    </main>
  </body>
</html>
```

- [ ] **Step 4: Update `src/components/ConstellationMenu.tsx` (hub click scrolls; links become hash links)**

Changes:
- Remove `import { navigate } from "astro:transitions/client";`.
- In the `constellation-nav` message handler, replace `void navigate(data.href)` with a scroll:

```tsx
      if (data.type !== "constellation-nav" || typeof data.href !== "string") return;
      const idx = NAV_SECTIONS.findIndex((s) => s.href === data.href);
      if (idx < 0) return;
      window.scrollTo({
        top: idx * window.innerHeight,
        behavior: prefersReducedMotion() ? "instant" : "smooth",
      });
```

- Change `href`s: `.site-name` → `#/`, each `.site-nav` link `href={s.href}` → `href={"#" + s.href}`.

- [ ] **Step 5: Update `src/styles/global.css` (document scroller + snap + deck)**

Immediately after the `html, body, #app { ... }` block add:

```css
html {
  scroll-snap-type: y proximity;
  scroll-behavior: smooth;
}
```

Remove `overflow: hidden;` from the `body` rule (keep the rest of `body`).

Replace the `.site-content` rule (lines ~24-31) and its `.site-content > *` rule (lines ~33-35) with:

```css
.site-content {
  position: relative;
  z-index: 5;
  box-sizing: border-box;
  min-height: 100%;
  pointer-events: none;
}

.deck-page {
  position: relative;
  height: 100vh;
  scroll-snap-align: start;
  pointer-events: none;
}

.deck-page .content-panel {
  pointer-events: auto;
}
```

Remove the `.content-panel.js-reveal > *`, `.content-panel.js-reveal > *.is-visible`, and the reduced-motion `.content-panel.js-reveal > *` blocks (lines ~220-239).

In the existing `@media (prefers-reduced-motion: reduce)` block add one rule:

```css
  html {
    scroll-behavior: auto;
  }
```

- [ ] **Step 6: Rewrite `tests/content.spec.ts` to the deck model**

Replace the whole file:

```ts
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
  expect(await panel.evaluate((el) => (el as HTMLElement).scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => Math.round(window.scrollY / window.innerHeight))).toBe(1);
});
```

- [ ] **Step 7: Update `tests/metrics.spec.ts` (no `/metrics` route)**

Replace both `page.goto("/metrics")` calls with:

```ts
await page.goto("/");
await page.evaluate(() => window.scrollTo({ top: 3 * window.innerHeight, behavior: "instant" }));
```

(keep the rest of each test identical; selectors are unchanged — the metrics section now lives on `/`).

- [ ] **Step 8: Update `tests/regression.spec.ts` (no route navigation)**

Replace the first test body (after `page.goto("/")` and nonce setup) so the hub click asserts a scroll instead of a URL change:

```ts
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
```

Replace the "mode persists" test `page.goto("/experience")` with `page.goto("/")` and replace the hub-click + `waitForURL` portion with a programmatic scroll:

```ts
test("mode persists when scrolling between pages", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "LIGHT" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-site-mode", "light");
  await page.evaluate(() => window.scrollTo({ top: 2 * window.innerHeight, behavior: "instant" }));
  await expect(page.locator("html")).toHaveAttribute("data-site-mode", "light");
});
```

Replace the final console-clean test to scroll through the whole deck on one route:

```ts
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
```

Leave the reduced-motion test as-is (it already goes to "/").

- [ ] **Step 9: Update `tests/chrome.spec.ts` (no route navigation)**

Replace the mobile click/assertions in the first test with:

```ts
  await navRow.locator('a[href="#/experience"]').click();
  expect(new URL(page.url()).pathname).toBe("/");
  await expect.poll(() => page.evaluate(() => new URL(location.href).hash)).toBe("#/experience");
```

Keep the desktop-hidden assertion and the six-link count. Keep the second (horizontal-overflow) test unchanged.

- [ ] **Step 10: Update `tests/menu.spec.ts` (hub clicks scroll, no URL change)**

In the `home hub` test: replace `page.waitForURL("**/")` + pathname assert with a scroll assert. Setup:

```ts
test("home hub scrolls back to the top", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.scrollTo({ top: 4 * window.innerHeight, behavior: "instant" }));
  const frame = page.frames().find((f) => f.url().startsWith("about:srcdoc"));
  expect(frame).toBeTruthy();
  const home = await hubPos(frame!, "/");
  await page.mouse.move(home.x, home.y);
  await expect
    .poll(async () => frame!.evaluate(() => (window as any).__CF_HOVER ?? null))
    .toBe(0);
  await page.mouse.click(home.x, home.y);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);
});
```

In the "hub glyphs render" test, after the click replace `waitForURL` + pathname with:

```ts
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(1 * 900);
```

In the "nav label" test, after the click replace `waitForURL` + pathname with:

```ts
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(2 * 900);
```

In the toggle test, replace `page.waitForURL("**/contact")` with:

```ts
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(4 * 900);
```

In the retina test, after the click replace `waitForURL` + pathname with:

```ts
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(1 * 900);
```

Leave the connected-lines test unchanged.

- [ ] **Step 11: Type check**

```bash
npm run check
```
Expected: 0 errors, 0 warnings.

- [ ] **Step 12: Run the Playwright suite**

```bash
npm test
```
Expected: all tests pass (foundation 2, content 4, metrics 2, regression 4, chrome 2, menu 6).

- [ ] **Step 13: Gate + commit**

```bash
npm run verify && git add -A && git commit -m "feat: render all pages as a scrollable deck on the index route"
```

---

### Task 2: Scroll-spy hash routing + active hub highlight + deep links

**Files:**
- Modify: `src/components/ConstellationMenu.tsx`
- Modify: `src/components/menu/menuScript.ts`
- Test: `tests/content.spec.ts`, `tests/menu.spec.ts`, `tests/regression.spec.ts`

**Interfaces:**
- Consumes: `frameWindow` ref (set on `constellation-ready`), `NAV_SECTIONS`, RUNTIME `message` listener.
- Produces:
  - `scrollToIndex(i, behavior)` helper in `ConstellationMenu.tsx`.
  - `goTo(href)` discrete-navigation helper in `ConstellationMenu.tsx` (pushState + setActive + post route + smooth scroll).
  - Host → frame message `{ type: "constellation-route", href }`.
  - RUNTIME exposes `window.__CF_ACTIVE` (number index, `-1` when none).
  - Hash routing: `#/experience` (pushState on discrete nav, replaceState on passive scroll).

- [ ] **Step 1: Write failing tests**

Append to `tests/content.spec.ts`:

```ts
test("scrolling updates the URL hash to the current page", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.scrollTo({ top: 4 * window.innerHeight, behavior: "instant" }));
  await expect.poll(() => page.evaluate(() => new URL(location.href).hash)).toBe("#/contact");
});

test("a deep link opens scrolled to that page", async ({ page }) => {
  await page.goto("/#/metrics");
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(3 * 900);
  await expect(page.locator('[data-page="metrics"]')).toBeVisible();
});

test("back/forward navigates between deck pages", async ({ page }) => {
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
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(5 * 900);
  await page.goBack();
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);
});
```

Append to `tests/menu.spec.ts`:

```ts
async function activeHubIndex(frame: any): Promise<number> {
  return frame.evaluate(() => (window as any).__CF_ACTIVE ?? -1);
}

test("the hub for the current page is lit", async ({ page }) => {
  await page.goto("/#/projects");
  const frame = page.frames().find((f) => f.url().startsWith("about:srcdoc"));
  expect(frame).toBeTruthy();
  await expect.poll(() => activeHubIndex(frame!)).toBe(5);
});

test("the lit hub follows scrolling", async ({ page }) => {
  await page.goto("/");
  const frame = page.frames().find((f) => f.url().startsWith("about:srcdoc"));
  expect(frame).toBeTruthy();
  await page.mouse.move(200, 700);
  await page.evaluate(() => window.scrollTo({ top: 2 * window.innerHeight, behavior: "instant" }));
  await expect.poll(() => activeHubIndex(frame!)).toBe(2);
});
```

Append to `tests/regression.spec.ts`:

```ts
test("back/forward restores hash and scroll without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/");
  await page.evaluate(() => window.scrollTo({ top: 1, behavior: "instant" }));
  const frame = page.frames().find((f) => f.url().startsWith("about:srcdoc"));
  await frame!.evaluate(() => {
    document.querySelector("canvas")!.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        clientX: (window as any).__CF_HUB_POS[3][0],
        clientY: (window as any).__CF_HUB_POS[3][1],
      }),
    );
  });
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(3 * 900);
  await expect.poll(() => page.evaluate(() => new URL(location.href).hash)).toBe("#/metrics");
  await page.goBack();
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Run them — expect failures**

```bash
npx playwright test tests/content.spec.ts tests/menu.spec.ts tests/regression.spec.ts
```
Expected: the new tests FAIL (`__CF_ACTIVE` undefined; hash unchanged; deep link not scrolled).

- [ ] **Step 3: Add the active-hub handling to the RUNTIME**

In `src/components/menu/menuScript.ts`, inside the RUNTIME string:

Near the top (with the other `window.__CF_*` assignments) add:
```js
  var active = -1;
```
(place it next to `var hover = -1;` on line 87).

Extend the existing `window.addEventListener('message', ...)` so it also handles the route (the `constellation-bounds` branch stays as-is):

```js
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'constellation-bounds' && typeof e.data.minX === 'number') {
      boundsMinX = e.data.minX;
    } else if (e.data && e.data.type === 'constellation-route' && typeof e.data.href === 'string') {
      for (var ri = 0; ri < DATA.length; ri++) {
        if (DATA[ri].href === e.data.href) {
          active = ri;
          window.__CF_ACTIVE = active;
          return;
        }
      }
      active = -1;
      window.__CF_ACTIVE = -1;
    }
  });
```

In `drawHubs`, change the active/hover test from `var on = i === hover;` to:

```js
      var on = i === hover || i === active;
```

- [ ] **Step 4: Add scroll-spy + hash routing to the host**

In `src/components/ConstellationMenu.tsx`:

Add a helper before the component:

```tsx
function scrollToIndex(index: number, behavior: "instant" | "smooth") {
  window.scrollTo({
    top: index * window.innerHeight,
    behavior: prefersReducedMotion() ? "instant" : behavior,
  });
}
```

Add state/refs to the component:

```tsx
  const currentIndex = useRef<string>("/");
```

Add inside the existing `onMessage` handler, right after the `constellation-ready` branch (which sets `frameWindow.current` and calls `sendBounds()`):

```tsx
      if (data.type === "constellation-ready" && event.source) {
        frameWindow.current = event.source as Window | null;
        sendBounds();
        frameWindow.current.postMessage(
          { type: "constellation-route", href: routeFromHash() },
          "*",
        );
        return;
      }
```

Add a `routeFromHash` helper (module scope):

```tsx
function routeFromHash() {
  const hash = window.location.hash.slice(1);
  const idx = NAV_SECTIONS.findIndex((s) => s.href === hash);
  return idx >= 0 ? NAV_SECTIONS[idx].href : "/";
}
```

In the `constellation-nav` handler, replace the inline scroll (Task 1 code) with a call to a discrete-navigation helper `goTo` (defined below):

```tsx
      if (data.type !== "constellation-nav" || typeof data.href !== "string") return;
      goTo(data.href);
```

Add `goTo` inside the component (uses `pushState` so back/forward works; the scroll-spy then only `replaceState`s on the same entry):

```tsx
  const goTo = (href: string) => {
    const idx = NAV_SECTIONS.findIndex((s) => s.href === href);
    if (idx < 0) return;
    if (href === currentIndex.current) return;
    currentIndex.current = href;
    setActiveHref(href);
    window.history.pushState(null, "", "#" + href);
    frameWindow.current?.postMessage({ type: "constellation-route", href }, "*");
    scrollToIndex(idx, "smooth");
  };
```

Replace the "route sync" effect body (currently the `useEffect` with `popstate`/`astro:page-load`/`resize` listeners) with:

```tsx
  useEffect(() => {
    const onScroll = () => {
      const raw = document.scrollingElement?.scrollTop ?? 0;
      const index = Math.min(
        Math.max(Math.round(raw / window.innerHeight), 0),
        NAV_SECTIONS.length - 1,
      );
      const href = NAV_SECTIONS[index].href;
      if (href === currentIndex.current) return;
      currentIndex.current = href;
      setActiveHref(href);
      window.history.replaceState(null, "", "#" + href);
      frameWindow.current?.postMessage({ type: "constellation-route", href }, "*");
    };
    const onResize = () => {
      sendBounds();
      if (document.scrollingElement) {
        scrollToIndex(
          Math.min(
            Math.max(Math.round(document.scrollingElement.scrollTop / window.innerHeight), 0),
            NAV_SECTIONS.length - 1,
          ),
          "instant",
        );
      }
    };
    const onPopState = () => {
      const href = routeFromHash();
      const idx = NAV_SECTIONS.findIndex((s) => s.href === href);
      if (idx < 0) return;
      const at = Math.round((document.scrollingElement?.scrollTop ?? 0) / window.innerHeight);
      if (href === currentIndex.current && at === idx) return;
      currentIndex.current = href;
      setActiveHref(href);
      scrollToIndex(idx, "smooth");
    };

    const initial = routeFromHash();
    const initialIndex = NAV_SECTIONS.findIndex((s) => s.href === initial);
    currentIndex.current = initial;
    setActiveHref(initial);
    if (initialIndex > 0) {
      scrollToIndex(initialIndex, "instant");
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);
```

Note: `sendBounds` and `frameWindow` are already in scope. If `currentIndex`/`setActiveHref` referenced without definition, check that `const [activeHref, setActiveHref] = useState("/")` exists (it does, line 29).

- [ ] **Step 5: Type check + run the full suite**

```bash
npm run check && npm test
```
Expected: 0 errors; all tests pass, including the new hash/active/deep-link tests.

- [ ] **Step 6: Gate + commit**

```bash
npm run verify && git add -A && git commit -m "feat: track the current deck page in the URL hash and light its hub"
```

---

### Task 3: Chrome navigation (brand + nav links) scrolls to sections

**Files:**
- Modify: `src/components/ConstellationMenu.tsx`
- Test: `tests/chrome.spec.ts`

**Interfaces:**
- Consumes: `goTo(href)` (Task 2), `scrollToIndex(index, behavior)` (Task 2), `NAV_SECTIONS`, `activeHref` state.
- Produces: click handlers on `.site-name` and each `.site-nav` anchor that call `goTo` (scroll the deck + publish the route).

- [ ] **Step 1: Write the failing test**

In `tests/chrome.spec.ts`, upgrade the mobile click test to assert a real scroll, the hash, and the active class (replacing the Task 1 hash-only assertion):

```ts
  await navRow.locator('a[href="#/experience"]').click();
  expect(new URL(page.url()).pathname).toBe("/");
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(844);
  await expect.poll(() => page.evaluate(() => new URL(location.href).hash)).toBe("#/experience");
  await expect(page.locator("a.is-active[href='#/experience']")).toHaveCount(1);
```

(`844` is the mobile viewport height from this test.)

Also add a brand-link test:

```ts
test("brand link scrolls back to home from another page", async ({ page }) => {
  await page.goto("/#/platform");
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(2 * 900);
  await page.locator(".site-name").click();
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);
  await expect(page.locator(".site-name")).toBeVisible();
});
```

- [ ] **Step 2: Run — expect failures**

```bash
npx playwright test tests/chrome.spec.ts
```
Expected: the click produces a scroll/anchor but no `is-active` and (for the brand test) an anchor jump to `#/` with no scroll → FAIL.

- [ ] **Step 3: Wire the click handlers**

In `src/components/ConstellationMenu.tsx`, `goTo` already exists from Task 2 (pushState + setActive + post route + smooth scroll). Add the two click handlers that call it (with `preventDefault` so the `#/...` hrefs don't double-apply):

```tsx
        <a
          href="#/"
          className="site-name"
          aria-label="home"
          onClick={(e) => {
            e.preventDefault();
            goTo("/");
          }}
        >
          SR0.OPERATOR
        </a>
```

Change each `.site-nav` anchor to:

```tsx
            <a
              key={s.id}
              href={"#" + s.href}
              className={matchHref(activeHref, s.href) ? "is-active" : undefined}
              onClick={(e) => {
                e.preventDefault();
                goTo(s.href);
              }}
            >
              {s.label}
            </a>
```

- [ ] **Step 4: Run chrome + menu + content specs**

```bash
npx playwright test tests/chrome.spec.ts tests/menu.spec.ts tests/content.spec.ts
```
Expected: all pass.

- [ ] **Step 5: Gate + commit**

```bash
npm run verify && git add -A && git commit -m "feat: scroll the deck from brand, nav, and mobile links"
```

---

### Task 4: Final gate — full suite, lint, verify, leftover cleanup

**Files:**
- Read: `src/styles/global.css`, `src/layouts/BaseLayout.astro`, `tests/*`, `scripts/verify-hashes.mjs`
- Test: full Playwright suite

**Interfaces:** (none — verification task)

- [ ] **Step 1: Sweep for leftovers**

Confirm, by grep, that none of these remain anywhere in `src/` or `tests/`:
- `js-reveal`, `is-visible`, `astro:page-load`, `ClientRouter`, `astro:transitions/client`, `navigate(`, `transition:persist`, `waitForURL`, route strings like `"/experience"` used in `goto(`/`waitForURL`.

Expected: only legitimate hits — `href "#/experience"`-style strings in links/tests are allowed; `matchHref` stays.

- [ ] **Step 2: Full gate**

```bash
npm run check && npx oxlint && npm run verify && npm test
```
Expected: Astro check 0 errors/0 warnings; oxlint only the known benign `react(only-export-components)` warning; verify clean; Playwright all green.

- [ ] **Step 3: Commit any fixups**

```bash
git add -A && git commit -m "chore: final cleanup for scroll-deck navigation"
```
(If there is nothing to commit, skip this step.)

---

### Task 5: Docs close-out

**Files:**
- Modify: `README.md`

**Interfaces:** (none — documentation)

- [ ] **Step 1: Update README**

Read `README.md`. If it documents the multi-route navigation or the reveal animation, update it to describe the scroll-deck model (single route `/`, hash deep links `#/page`, scroll/nodes to navigate, internal panel scrolling). Keep edits minimal and factual.

- [ ] **Step 2: Commit**

```bash
git add README.md && git commit -m "docs: update README for scroll-deck navigation"
```
(If the README needs no change, skip.)

---

## Self-Review Notes

- **Spec coverage:** Layout (Task 1), scroll model + snap (Task 1 CSS), hash routing + spy (Task 2), navigation sources + removal of ClientRouter/navigate (Tasks 1&3), field feedback for active section (Task 2 RUNTIME), reduced motion (Task 1 CSS `scroll-behavior: auto` + `scrollToIndex`), kicker renumbering (Task 1 markup), route deletion (Task 1), standalone-URL 404 acceptance (Task 1 route deletion), 404 page untouched (none of the tasks touch it), mode persistence (Tasks 1&2 tests), internal panel scrolling (Task 1 test), deep links + back/forward (Task 2 tests). Edge cases for resize and popstate covered in Task 2 listeners.
- **Placeholder scan:** no TBD/TODO; every step carries code or an exact command.
- **Type consistency:** `scrollToIndex` defined in Task 2, used identically in Tasks 2–4; `goTo` defined in Task 2 (pushState discrete nav), consumed by the `constellation-nav` handler and by Task 3's brand/nav click handlers; `routeFromHash` defined in Task 2, used by the `constellation-ready` branch and the `popstate` handler; RUNTIME `active`/`__CF_ACTIVE` defined in Task 2 and consumed by tests and `drawHubs` only after that task.