# Constellation Brutalist Portfolio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Constellation Field effect into a six-section brutalist portfolio where the constellation's nodes are the clickable main menu, hosted on Astro with persisted crossfade navigation.

**Architecture:** Astro static MPA renders six routes through a shared `BaseLayout` that mounts the full-screen `ConstellationMenu` React island (`client:load transition:persist`) plus a per-page content slot. The island owns mode state and the dark↔light toggle, draws a host-authored **menu script** over the sandboxed effect iframe via the effect's existing `suffixScript` injection point, listens for `constellation-nav` postMessage from the iframe, and calls `navigate()` from `astro:transitions/client` for crossfaded route changes.

**Tech Stack:** Astro 6 (static output), @astrojs/react 6, React 19, TypeScript strict, Playwright (chromium) for verification. The existing `src/effects/constellation-field` module moves over unchanged except for the one additive `suffixScript` prop.

**Spec:** `docs/superpowers/specs/2026-09-06-constellation-portfolio-design.md`

## Global Constraints

- Node ≥ 20 (local: v24.15.0). Package manager: npm.
- Astro 6 with `@astrojs/react`; React 19 already installed. Framework files are `.tsx`; routes are `.astro`.
- The 8 authored HTML sources under `src/effects/constellation-field/sources/` are NEVER edited; their SHA-256 hashes are regression-verified.
- The only allowed edit to `NeuformBatchEffects.tsx` beyond the pre-existing per-mode color patch is the additive, optional `suffixScript?: string` prop (defaults to undefined, zero behavior change).
- Palette contract: dark field blue `#50A0F0`, light field gold `#B8860B`; backgrounds `#070914` (night) / `#eef1f6` (paper). Night/paper are also the global chrome colors.
- Six menu sections, hub labels `01 HOME, 02 EXPERIENCE, 03 PLATFORM, 04 PROJECTS, 05 METRICS, 06 CONTACT`; hubs = first 6 nodes, pinned to normalized coordinates.
- Constellation persists across navigation (island `transition:persist` + iframe element moved, not recreated); mode persists across navigation (module singleton).
- `prefers-reduced-motion`: static field, no transition/dissolve/blink animations.
- Coarse pointers / `<768px`: brutalist top nav row is the primary nav affordance; hubs stay tappable where reachable.
- Dummy but plausible DevOps/SRE content; persona label "Senior DevOps/SRE Engineer".
- No code comments in implementation code (per repo convention held from earlier work).
- Zero console/page errors in all Playwright runs; hub navigation must not do a full reload.
- Build + typecheck (`astro check`) + lint (oxlint) must pass at every task boundary.

---

### Task 1: Astro foundation & effect renders under Astro

Retrofit the Vite scaffold into an Astro static project and prove the existing effect mounts and animates as a React island before any menu work begins.

**Files:**
- Modify: `package.json` (scripts/deps), `tsconfig.json` (replace), `src/index.css` → move to `src/styles/global.css`
- Create: `astro.config.mjs`, `src/env.d.ts`, `src/layouts/BaseLayout.astro`, `src/pages/index.astro`
- Delete: `index.html`, `src/main.tsx`, `src/App.tsx`, `src/Scene.tsx`, `vite.config.ts`, `src/index.css`
- Test: `tests/foundation.spec.ts`, `playwright.config.ts` (created here, reused by all later tasks)

**Interfaces:**
- Consumes: existing `ConstellationField` from `src/effects/constellation-field/ConstellationField.tsx`
- Produces: `BaseLayout` (takes `title` prop, renders slot + `<ClientRouter />`); package scripts `dev/build/preview/check/lint/test`; Playwright webServer on port 8765 serving the built site

- [ ] **Step 1: Install & configure Astro**

Run: `npm i -D astro@latest @astrojs/react@latest @astrojs/check@latest @playwright/test@latest && npm rm vite @vitejs/plugin-react && npx playwright install chromium`

Expected: Astro deps installed, vite removed as a direct dep (it remains transitively), chromium browser matches the existing `~/Library/Caches/ms-playwright` cache.

- [ ] **Step 2: Update package.json scripts**

Set `"scripts"` to:

```json
{
  "dev": "astro dev",
  "build": "astro build",
  "check": "astro check",
  "lint": "oxlint",
  "preview": "astro preview",
  "test": "playwright test"
}
```

Keep everything else in package.json unchanged (react/react-dom stay `dependencies`).

- [ ] **Step 3: Create astro.config.mjs**

```js
import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  output: "static",
  integrations: [react()],
});
```

- [ ] **Step 4: Replace tsconfig.json**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 5: Create src/env.d.ts**

```ts
/// <reference types="astro/client" />
```

- [ ] **Step 6: Create BaseLayout.astro**

```astro
---
import { ClientRouter } from "astro:transitions";
import "../styles/global.css";

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
    <ClientRouter />
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 7: Create src/styles/global.css (foundation reset)**

```css
html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  overflow: hidden;
  background: #070914;
  color: #eef1f6;
  font-family: "SF Mono", "Cascadia Mono", Menlo, Monaco, Consolas, monospace;
}
```

(The `#app` rule is harmless; a full brutalist token system lands in Task 4.)

- [ ] **Step 8: Create the temporary home page proving the effect as an island**

`src/pages/index.astro`:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import "../effects/constellation-field/styles.css";
import { ConstellationField } from "../effects/constellation-field/ConstellationField";
---
<BaseLayout title="Senior DevOps/SRE Engineer">
  <main class="probe">
    <ConstellationField
      client:load
      mode="dark"
      speed={0.5}
      size={0.5}
      strokeWidth={0.5}
      length={0.9}
      density={1.4}
      opacity={1}
      hue={0}
      saturation={1.1}
      brightness={1}
      style={{ position: "fixed", inset: 0 }}
    />
  </main>
</BaseLayout>
```

This is temporary; `ConstellationMenu` replaces it in Task 3.

- [ ] **Step 9: Delete the Vite entry points**

Run: `git rm index.html src/main.tsx src/App.tsx src/Scene.tsx vite.config.ts src/index.css`

- [ ] **Step 10: Write the failing Playwright foundation test**

`playwright.config.ts`:

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  fullyParallel: false,
  use: {
    baseURL: "http://localhost:8765",
    viewport: { width: 1440, height: 900 },
    browserName: "chromium",
  },
  webServer: {
    command: "npm run build && npm run preview -- --port 8765",
    url: "http://localhost:8765",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
```

`tests/foundation.spec.ts`:

```ts
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
```

- [ ] **Step 11: Run test to verify it fails**

Run: `npm test -- tests/foundation.spec.ts`
Expected: FAIL (build fails or webServer cannot start — no Astro project yet).

- [ ] **Step 12: Implement (the configuration + files above) and build**

Run: `npm run build`
Expected: `dist/index.html` produced; `astro check` reports zero errors.

- [ ] **Step 13: Run test to verify it passes**

Run: `npm test -- tests/foundation.spec.ts`
Expected: PASS. The iframe renders and more than 1000 filled pixels are visible (the network is drawing).

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "feat: bootstrap astro site hosting the constellation field island"
```

---

### Task 2: `suffixScript` injection support in the effect module

Add the single additive host-boundary prop: `suffixScript?: string`, threaded through the props type, the `NeuformBatchEffect` renderer, and `buildFocusedDocument`, which appends it before `</body>` right after `focusScript`. Applies to every variant but only activates when provided.

**Files:**
- Modify: `src/effects/constellation-field/NeuformBatchEffects.tsx` (prop type at line 53, destructure in `NeuformBatchEffect` at line 812, signature of `buildFocusedDocument` at line 688, the final `.replace` at line 809, and the `useMemo` deps at line 862)
- Test: `tests/suffix.spec.ts`

**Interfaces:**
- Consumes: `NeuformBatchEffectProps` (Task 1 unchanged)
- Produces: `suffixScript?: string` on `NeuformBatchEffectProps` — raw HTML appended inside the frame's document before `</body>`. Task 3 passes a full `<script>` through it.

- [ ] **Step 1: Write the failing test**

`tests/suffix.spec.ts` (final version — fails until the marker is wired in Step 3):

```ts
import { test, expect } from "@playwright/test";

test("suffixScript is injected and executes inside the frame", async ({ page }) => {
  await page.goto("/");
  const frame = page.frames().find((f) => f.url().startsWith("about:srcdoc"));
  expect(frame).toBeTruthy();
  const marker = await frame!.evaluate(() => (window as any).__SUFFIX_OK ?? null);
  expect(marker).toBe(7);
});
```

Run: `npm test -- tests/suffix.spec.ts`
Expected: FAIL — `__SUFFIX_OK` is `null` (no plumbing, no marker).

- [ ] **Step 2: Implement the plumbing in NeuformBatchEffects.tsx**

Edit 1 — add the optional prop to the type (line 53 block):

```ts
export type NeuformBatchEffectProps = {
  variant?: string;
  mode?: NeuformModePreference;
  speed?: number;
  size?: number;
  gap?: number;
  length?: number;
  density?: number;
  strokeWidth?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  suffixScript?: string;
  className?: string;
  style?: CSSProperties;
};
```

Edit 2 — extend `buildFocusedDocument` signature (line 688):

```ts
function buildFocusedDocument(
  definition: EffectDefinition,
  knobs: BakeKnobs & {
    speed: number;
    opacity: number;
    suffixScript?: string;
  },
) {
```

Edit 3 — extend the final injection (line 807-809). Replace:

```ts
  return patchedSource
    .replace(/<head([^>]*)>/i, `<head$1>${controlScript}${focusStyle}`)
    .replace(/<\/body>/i, `${focusScript}</body>`);
```

with:

```ts
  return patchedSource
    .replace(/<head([^>]*)>/i, `<head$1>${controlScript}${focusStyle}`)
    .replace(/<\/body>/i, `${focusScript}${knobs.suffixScript ?? ""}</body>`);
```

Edit 4 — thread the prop in `NeuformBatchEffect` (line 812 destructure; add `suffixScript,`):

```ts
  brightness = NEUFORM_BATCH_DEFAULTS.brightness,
  suffixScript,
  className,
  style,
}: NeuformBatchEffectProps & { definition: EffectDefinition }) {
```

Edit 5 — pass it into the `useMemo` (line 851):

```ts
  const source = useMemo(
    () =>
      buildFocusedDocument(definition, {
        variant,
        mode: resolvedMode,
        speed: NEUFORM_BATCH_DEFAULTS.speed,
        size: safeSize,
        gap: safeGap,
        length: safeLength,
        density: safeDensity,
        strokeWidth: safeStrokeWidth,
        opacity: NEUFORM_BATCH_DEFAULTS.opacity,
        suffixScript,
      }),
    [definition, resolvedMode, safeDensity, safeGap, safeLength, safeSize, safeStrokeWidth, suffixScript, variant],
  );
```

- [ ] **Step 3: Wire the marker through the temporary home page**

`src/pages/index.astro` — add `suffixScript={MARKER}` and define it in the frontmatter:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import "../effects/constellation-field/styles.css";
import { ConstellationField } from "../effects/constellation-field/ConstellationField";

const MARKER = `<script data-test-suffix>window.__SUFFIX_OK = 7;<\/script>`;
---
<BaseLayout title="Senior DevOps/SRE Engineer">
  <main class="probe">
    <ConstellationField
      client:load
      mode="dark"
      speed={0.5}
      size={0.5}
      strokeWidth={0.5}
      length={0.9}
      density={1.4}
      opacity={1}
      hue={0}
      saturation={1.1}
      brightness={1}
      suffixScript={MARKER}
      style={{ position: "fixed", inset: 0 }}
    />
  </main>
</BaseLayout>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tests/suffix.spec.ts tests/foundation.spec.ts`
Expected: PASS — marker evaluates to `7` inside the frame; the effect still renders (foundation passes). Also run `npm run check && npm run lint` — zero issues.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add generic suffixScript injection to the effect module"
```

---

### Task 3: ConstellationMenu — menu script, navigation bridge, and toggle

The core piece. Build `src/components/menu/menuScript.ts` (host-authored runtime overlay), the `ConstellationMenu.tsx` persistent island (mode state via module singleton, `navigate()` message bridge, toggle with dissolve, brutalist chrome shell), a `404.astro`, and switch `BaseLayout` to mount the island full-screen with the content slot on top.

**Files:**
- Create: `src/components/menu/menuScript.ts`, `src/components/ConstellationMenu.tsx`, `src/pages/404.astro`
- Modify: `src/layouts/BaseLayout.astro`, `src/styles/global.css` (minimal layout rules: `.site-content`, `.probe` removal), `src/pages/index.astro` (render `ConstellationMenu` flavor via BaseLayout slot; island handled by layout)
- Test: `tests/menu.spec.ts`

**Interfaces:**
- Produces:
  - `type ConstellationMenuSection = { id: string; label: string; href: string; x: number; y: number; anchor: "left" | "right" }`
  - `const NAV_SECTIONS: ConstellationMenuSection[]` (single source of truth for hubs, nav row, and page links)
  - `buildMenuScript(sections: ConstellationMenuSection[]): string` — returns `<script data-threeui-menu>...` for `suffixScript`
  - `ConstellationMenu` React island with props `client:load transition:persist` usage from layout, own mode state, editing `document.documentElement.dataset.siteMode`, dispatching `navigate()` on `constellation-nav` messages.

- [ ] **Step 1: Write the failing menu test**

`tests/menu.spec.ts`:

```ts
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
```

Run: `npm test -- tests/menu.spec.ts`
Expected: FAIL — `__CF_HUB_COUNT` is `-1` (no island / no menu script yet).

- [ ] **Step 2: Implement menuScript.ts**

```ts
export type ConstellationMenuSection = {
  id: string;
  label: string;
  href: string;
  x: number;
  y: number;
  anchor: "left" | "right";
};

export const NAV_SECTIONS: ConstellationMenuSection[] = [
  { id: "home", label: "01 HOME", href: "/", x: 0.12, y: 0.26, anchor: "right" },
  { id: "experience", label: "02 EXPERIENCE", href: "/experience", x: 0.12, y: 0.5, anchor: "right" },
  { id: "platform", label: "03 PLATFORM", href: "/platform", x: 0.12, y: 0.74, anchor: "right" },
  { id: "projects", label: "04 PROJECTS", href: "/projects", x: 0.88, y: 0.26, anchor: "left" },
  { id: "metrics", label: "05 METRICS", href: "/metrics", x: 0.88, y: 0.5, anchor: "left" },
  { id: "contact", label: "06 CONTACT", href: "/contact", x: 0.88, y: 0.74, anchor: "left" },
];

const RUNTIME = `(function (DATA) {
  if (!nodes || !DATA || !DATA.length) return;
  var canvas = document.getElementById('constellationCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  window.__CF_HUB_COUNT = DATA.length;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var palette = { dark: '#50A0F0', light: '#B8860B' };
  var mono = '"SF Mono", "Cascadia Mono", Menlo, Monaco, Consolas, monospace';
  function modeColor() {
    var mode = (window.__SF_CONTROLS && window.__SF_CONTROLS.mode) || 'dark';
    return palette[mode] || palette.dark;
  }
  function hubPos(i) {
    return [DATA[i].x * width, DATA[i].y * height];
  }
  function pin() {
    for (var i = 0; i < DATA.length && i < nodes.length; i++) {
      nodes[i].vx = 0;
      nodes[i].vy = 0;
    }
  }
  function hit(x, y) {
    for (var i = 0; i < DATA.length; i++) {
      var p = hubPos(i);
      var dx = p[0] - x, dy = p[1] - y;
      if (dx * dx + dy * dy < 32 * 32) return i;
    }
    return -1;
  }
  var hover = -1;
  canvas.addEventListener('mousemove', function (e) { hover = hit(e.clientX, e.clientY); });
  canvas.addEventListener('mouseleave', function () { hover = -1; });
  canvas.addEventListener('click', function (e) {
    var i = hit(e.clientX, e.clientY);
    if (i < 0) return;
    window.parent.postMessage({ type: 'constellation-nav', href: DATA[i].href }, '*');
  });
  function drawHubs() {
    var c = modeColor();
    for (var i = 0; i < DATA.length; i++) {
      var s = DATA[i];
      var p = hubPos(i);
      var x = p[0], y = p[1];
      var on = i === hover;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = c;
      ctx.globalAlpha = on ? 1 : 0.92;
      ctx.fillRect(-4, -4, 8, 8);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = c;
      ctx.lineWidth = 1;
      ctx.strokeRect(-4.5, -4.5, 9, 9);
      if (on) {
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.font = '11px ' + mono;
      ctx.textBaseline = 'middle';
      if (s.anchor === 'left') {
        ctx.textAlign = 'right';
        ctx.fillText(s.label, -16, 0);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(s.label, 16, 0);
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  function netDraw() {
    ctx.clearRect(0, 0, width, height);
    var c = modeColor();
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    ctx.strokeStyle = c;
    ctx.lineWidth = 1;
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < LINK) {
          ctx.globalAlpha = 0.22 + (1 - d / LINK) * 0.55;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }
    for (var k = 0; k < nodes.length; k++) {
      var nd = nodes[k];
      var r = nd.radius || 2;
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.22;
      ctx.beginPath();
      ctx.arc(nd.x, nd.y, r * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.78;
      ctx.beginPath();
      ctx.arc(nd.x, nd.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    drawHubs();
  }
  function tick() {
    for (var i = 0; i < DATA.length && i < nodes.length; i++) {
      var p = hubPos(i);
      nodes[i].x = p[0];
      nodes[i].y = p[1];
    }
    drawHubs();
    requestAnimationFrame(tick);
  }
  function rePin() {
    pin();
    if (reduced) netDraw();
  }
  window.addEventListener('resize', rePin);
  pin();
  if (reduced) {
    netDraw();
  } else {
    requestAnimationFrame(tick);
  }
})`;

const TOKEN = "__CF_MENU_SECTIONS__";

export function buildMenuScript(sections: ConstellationMenuSection[]): string {
  if (!sections.length) return "";
  const json = JSON.stringify(sections).replace(/</g, "\\u003c");
  return `<script data-threeui-menu>${RUNTIME}(${json});</script>`;
}
```

- [ ] **Step 3: Implement ConstellationMenu.tsx**

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { navigate } from "astro:transitions/client";
import { ConstellationField } from "../effects/constellation-field/ConstellationField";
import { buildMenuScript, NAV_SECTIONS } from "./menu/menuScript";
import "../effects/constellation-field/styles.css";

type Mode = "dark" | "light";
type Phase = "idle" | "out" | "in";

const MODE_TRANSITION_MS = 380;

const MODE_STORE: { value: Mode } = { value: "dark" };

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

function matchHref(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname === "";
  return pathname.startsWith(href);
}

export default function ConstellationMenu() {
  const [mode, setModeState] = useState<Mode>(MODE_STORE.value);
  const [phase, setPhase] = useState<Phase>("idle");
  const [activeHref, setActiveHref] = useState("/");
  const pendingMode = useRef<Mode | null>(null);
  const timers = useRef<number[]>([]);
  const menuScript = useMemo(() => buildMenuScript(NAV_SECTIONS), []);

  const setMode = (next: Mode) => {
    MODE_STORE.value = next;
    setModeState(next);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.siteMode = next;
    }
  };

  useEffect(() => {
    const current = timers.current;
    return () => current.forEach((id) => window.clearTimeout(id));
  }, []);

  const switchMode = (next: Mode) => {
    if (next === mode || next === pendingMode.current) return;
    if (prefersReducedMotion()) {
      setMode(next);
      return;
    }
    pendingMode.current = next;
    setPhase("out");
    timers.current.push(
      window.setTimeout(() => {
        setMode(next);
        setPhase("in");
        timers.current.push(
          window.setTimeout(() => {
            setPhase("idle");
            pendingMode.current = null;
          }, MODE_TRANSITION_MS + 40),
        );
      }, MODE_TRANSITION_MS),
    );
  };

  useEffect(() => {
    setMode(MODE_STORE.value);
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; href?: unknown } | null;
      if (!data || data.type !== "constellation-nav" || typeof data.href !== "string") return;
      if (data.href === window.location.pathname) return;
      void navigate(data.href);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    const update = () => setActiveHref(window.location.pathname);
    update();
    window.addEventListener("popstate", update);
    document.addEventListener("astro:page-load" as never, update);
    return () => {
      window.removeEventListener("popstate", update);
      document.removeEventListener("astro:page-load" as never, update);
    };
  }, []);

  const activeIndex =
    NAV_SECTIONS.findIndex((s) => matchHref(activeHref, s.href)) + 1;

  const transitioning = phase !== "idle";

  return (
    <div
      className={`effect-frame site-constellation ${transitioning ? "is-transitioning" : ""}`}
      data-mode={mode}
    >
      <div className="effect-scene">
        <ConstellationField
          mode={mode}
          speed={0.5}
          size={0.5}
          strokeWidth={0.5}
          length={0.9}
          density={1.4}
          opacity={1}
          hue={0}
          saturation={1.1}
          brightness={1}
          suffixScript={menuScript}
        />
      </div>
      <header className="site-bar">
        <span className="site-name" aria-hidden="true">
          SR0.OPERATOR
        </span>
        <span className="site-coords" aria-hidden="true">
          47.3769N 08.5417E
        </span>
        <span className="site-index" aria-hidden="true">
          {String(activeIndex).padStart(2, "0")}/06
        </span>
        <button
          type="button"
          className="site-toggle"
          onClick={() => switchMode(mode === "dark" ? "light" : "dark")}
          disabled={transitioning}
          aria-pressed={mode === "light"}
        >
          {mode === "dark" ? "LIGHT" : "DARK"}
        </button>
      </header>
    </div>
  );
}
```

- [ ] **Step 4: Mount the island from BaseLayout**

`src/layouts/BaseLayout.astro` body becomes:

```astro
  <body>
    <ConstellationMenu client:load transition:persist />
    <main class="site-content" data-page>
      <slot />
    </main>
  </body>
```

with an import added in the frontmatter:

```astro
import ConstellationMenu from "../components/ConstellationMenu";
```

- [ ] **Step 5: Minimal layout CSS + home page**

Append to `src/styles/global.css`:

```css
.site-constellation {
  position: fixed;
  inset: 0;
  z-index: 0;
}

.site-content {
  position: relative;
  z-index: 5;
  box-sizing: border-box;
  height: 100vh;
  overflow: hidden;
}

.site-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 20px;
  border-bottom: 1px solid currentColor;
  background: rgba(7, 9, 20, 0.55);
}

.site-bar .site-index {
  margin-left: auto;
}

.site-toggle {
  border: 1px solid currentColor;
  background: transparent;
  color: inherit;
  font: 700 11px ui-monospace, monospace;
  letter-spacing: 0.14em;
  padding: 8px 14px;
  cursor: pointer;
}

.probe {
  display: none;
}
```

Replace `src/pages/index.astro` with a shell (real Home content is Task 4/5):

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---
<BaseLayout title="Senior DevOps/SRE Engineer">
  <article class="bio-panel">
    <h1>Senior DevOps/SRE Engineer</h1>
  </article>
</BaseLayout>
```

- [ ] **Step 6: Create 404.astro (same BaseLayout) so in-between routes keep the island**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---
<BaseLayout title="404 — SR0.OPERATOR">
  <article class="bio-panel">
    <h1>404 / NO SUCH ROUTE</h1>
    <p>The constellation knows no node here.</p>
  </article>
</BaseLayout>
```

- [ ] **Step 7: Run check/lint/build then the menu tests**

Run: `npm run check && npm run lint && npm test -- tests/menu.spec.ts`
Expected: PASS — 6 hubs detected in-frame, hub click navigates to `/experience`/`/contact` with no reload (URL changes via ClientRouter), toggle sets `data-site-mode="light"` and it survives navigation.

If the navigation asserts fail because the 404 route races, add `await page.waitForLoadState("load")` before the `waitForURL`; the Task-7 regression suite guards the iframe no-recreate guarantee separately.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: constellation menu island with postMessage navigation bridge"
```

---

### Task 4: Brutalist chrome, responsive behavior, and content styles

Full design token system, the header/rail/nav-row chrome, mobile nav affordance (<768px), reduced-motion CSS, and the styles content blocks use. This task is CSS-forward; pages still use the placeholder `bio-panel`.

**Files:**
- Modify: `src/styles/global.css`, `src/components/ConstellationMenu.tsx` (add nav row + rail markup)
- Test: `tests/chrome.spec.ts`

**Interfaces:**
- Consumes: `NAV_SECTIONS`, `activeHref`, `activeIndex` from Task 3
- Produces: CSS custom props `--night`, `--paper`, `--fg`, `--bg`, `--divide`, `--panel` on `:root[data-site-mode]`; classes `.site-bar`, `.site-rail`, `.site-nav`, `.bio-panel`, `.content-panel`, `.hairline`; a `<nav class="site-nav">` row of `NAV_SECTIONS` links gated to `display:none` above 768px.

- [ ] **Step 1: Write the failing chrome test**

`tests/chrome.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("nav row is hidden on desktop, visible with links on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const navRow = page.locator(".site-nav");
  await expect(navRow).toBeHidden();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(navRow).toBeVisible();
  await expect(navRow.locator("a")).toHaveCount(6);

  await navRow.locator('a[href="/experience"]').click();
  await page.waitForURL("**/experience");
  await expect(page.locator("a.is-active[href='/experience']")).toHaveCount(1);
});

test("no horizontal overflow at mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
```

Run: `npm test -- tests/chrome.spec.ts` — expect FAIL (no `.site-nav` yet).

- [ ] **Step 2: Write the brutalist token system (append/replace global.css)**

Append to `src/styles/global.css`:

```css
:root[data-site-mode="dark"] {
  --bg: #070914;
  --fg: #eef1f6;
  --muted: #9aa3bc;
  --panel: rgba(7, 9, 20, 0.78);
  --divide: #3a3f52;
}

:root[data-site-mode="light"] {
  --bg: #eef1f6;
  --fg: #070914;
  --muted: #4a5164;
  --panel: rgba(238, 241, 246, 0.85);
  --divide: #181b26;
}

:root {
  color-scheme: dark;
}

:root[data-site-mode="light"] {
  color-scheme: light;
}

html,
body {
  background: var(--bg);
  color: var(--fg);
  transition: background-color 380ms ease, color 380ms ease;
}

.site-bar {
  align-items: baseline;
  background: var(--panel);
  color: var(--fg);
}

.site-nav {
  display: none;
  gap: 12px;
  margin-left: auto;
}

.site-nav a {
  color: var(--muted);
  text-decoration: none;
  font-size: 11px;
  letter-spacing: 0.12em;
}

.site-nav a.is-active {
  color: var(--fg);
  text-decoration: underline;
  text-underline-offset: 4px;
}

.site-rail {
  position: fixed;
  left: 12px;
  bottom: 12px;
  z-index: 20;
  display: flex;
  flex-direction: column-reverse;
  gap: 6px;
  font-size: 10px;
  color: var(--muted);
  letter-spacing: 0.18em;
}

.site-rail span.is-active {
  color: var(--fg);
}

@media (max-width: 767px) {
  .site-nav {
    display: flex;
  }
  .site-coords {
    display: none;
  }
  .site-index {
    margin-left: 0;
  }
}

.bio-panel,
.content-panel {
  box-sizing: border-box;
  background: var(--panel);
  border: 1px solid var(--divide);
  border-radius: 0;
}

.bio-panel {
  margin: 96px 24px 24px;
  padding: 32px;
  max-width: 820px;
}

.content-panel {
  padding: 24px;
}

@media (prefers-reduced-motion: reduce) {
  html,
  body,
  .effect-frame,
  .effect-scene,
  .site-bar {
    transition: none;
  }
  .site-toggle {
    transition: none;
  }
}
```

- [ ] **Step 3: Add nav row markup to ConstellationMenu's header**

Insert between `.site-coords` and `.site-index` inside `<header className="site-bar">`:

```tsx
        <nav className="site-nav" aria-label="primary">
          {NAV_SECTIONS.map((s) => (
            <a
              key={s.id}
              href={s.href}
              className={matchHref(activeHref, s.href) ? "is-active" : undefined}
            >
              {s.label}
            </a>
          ))}
        </nav>
```

and add the rail element before the closing `</div>` of the island root:

```tsx
      <div className="site-rail" aria-hidden="true">
        {NAV_SECTIONS.map((s) => (
          <span
            key={s.id}
            className={matchHref(activeHref, s.href) ? "is-active" : undefined}
          >
            {s.label.slice(0, 2)}
          </span>
        ))}
      </div>
```

Add to `.site-rail` in global.css a matching active rule:

```css
.site-rail span.is-active {
  color: var(--fg);
}
```

- [ ] **Step 4: Verify**

Run: `npm run check && npm run build && npm test -- tests/chrome.spec.ts tests/menu.spec.ts`
Expected: PASS — nav row hidden ≥768px, visible at 390px with 6 links; clicking a link navigates and marks it active; no mobile overflow; menu tests still green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: brutalist chrome, responsive nav row, and mode tokens"
```

---

### Task 5: Content data and the six content pages

Create `src/data/site.ts` with all dummy-but-plausible SRE content, build the six `.astro` pages (Home, Experience, Platform, Projects, Contact; a stub Metrics page), and add the shared content styles. All content is static HTML over the persistent field.

**Files:**
- Create: `src/data/site.ts`, `src/pages/experience.astro`, `src/pages/platform.astro`, `src/pages/projects.astro`, `src/pages/metrics.astro` (stub — final gauges in Task 6), `src/pages/contact.astro`
- Modify: `src/pages/index.astro`, `src/styles/global.css` (content styles)
- Test: `tests/content.spec.ts`

**Interfaces:**
- Consumes: `BaseLayout` (title prop), `NAV_SECTIONS` (for the page title index)
- Produces: exported `SITE`, `EXPERIENCE`, `SKILLS`, `PROJECTS`, `METRICS` from `src/data/site.ts`; page markup with `data-page` attributes `home|experience|platform|projects|metrics|contact`

- [ ] **Step 1: Write the failing content test**

`tests/content.spec.ts`:

```ts
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
```

Run: `npm test -- tests/content.spec.ts` — expect FAIL (routes 404).

- [ ] **Step 2: Create src/data/site.ts**

```ts
export const SITE = {
  role: "Senior DevOps/SRE Engineer",
  handle: "SR0.OPERATOR",
  email: "sr0.operator@example.com",
  github: "https://github.com/sr0-operator",
  linkedin: "https://www.linkedin.com/in/sr0-operator",
  location: "47.3769N 08.5417E",
  tagline:
    "Turns unmanaged chaos into enforceable SLOs. Builds platforms that fail gracefully and wake nobody.",
};

export type Role = {
  title: string;
  company: string;
  period: string;
  stack: string[];
  points: string[];
};

export const EXPERIENCE: Role[] = [
  {
    title: "Senior Site Reliability Engineer",
    company: "Northbridge Systems",
    period: "2022 — PRESENT",
    stack: ["Kubernetes", "Terraform", "Prometheus", "Go", "AWS"],
    points: [
      "Owns the error budget for a 12-region platform processing 14k req/s; SLO 99.95% met 9 consecutive quarters.",
      "Cut median page-build time 41% by replacing ad-hoc Jenkins pipelines with Argo Workflows on CI runners.",
      "Wrote the on-call runbook and rotated primary incident commander for 28 months, MTTA down 3.4x.",
    ],
  },
  {
    title: "DevOps Engineer",
    company: "Relayforge Labs",
    period: "2019 — 2022",
    stack: ["Docker", "Consul", "Grafana", "GitHub Actions", "Vault"],
    points: [
      "Designed the golden-path platform: one CLI, one API, repeatable infra for 40+ microservices.",
      "Introduced policy-as-code (OPA) gates; reduced prod misconfig incidents to near zero.",
      "Moved secrets out of env files into Vault with agent-side injection and audit trails.",
    ],
  },
  {
    title: "Platform Engineer",
    company: "Cinder & Coal (acq. 2019)",
    period: "2017 — 2019",
    stack: ["AWS", "Ansible", "Python", "Postgres", "ELK"],
    points: [
      "Provisioned and hardened a SOC2-aligned network from empty account to green audit in 11 months.",
      "Built the first real staging environment; yeeted 80% of 'works on my machine' bugs.",
      "Automated database backup/restore drills including quarterly tape-to-object restore tests.",
    ],
  },
];

export type SkillGroup = { name: string; tags: string[] };

export const SKILLS: SkillGroup[] = [
  { name: "ORCHESTRATION", tags: ["Kubernetes", "Helm", "Kustomize", "OpenShift", "Nomad", "AWS ECS"] },
  { name: "INFRASTRUCTURE", tags: ["Terraform", "OpenTofu", "Pulumi", "Ansible", "CloudFormation"] },
  { name: "OBSERVABILITY", tags: ["Prometheus", "Grafana", "OpenTelemetry", "Loki", "Sentry", "Datadog"] },
  { name: "CI/CD", tags: ["GitHub Actions", "Argo CD", "Argo Workflows", "Tekton", "CircleCI", "Jenkins"] },
  { name: "CLOUD", tags: ["AWS", "GCP", "Azure", "VPC", "IAM", "Cost Allocation"] },
  { name: "PRACTICES", tags: ["SLOs", "Error Budgets", "On-Call", "Chaos Engineering", "Blameless RCAs", "Runbooks"] },
];

export type Project = {
  name: string;
  summary: string;
  stack: string[];
  status: string;
};

export const PROJECTS: Project[] = [
  {
    name: "quantum-scaler",
    summary: "Kubernetes HPA refinement that turns p99 latency + SLO burn into scale decisions; validated in staging for 5 weeks without a single pod churn spike.",
    stack: ["Go", "Kubernetes", "Prometheus", "Vertical Pod Autoscaler"],
    status: "IN PROD — 2 CLUSTERS",
  },
  {
    name: "chaos-forge",
    summary: "Scheduled chaos drill toolkit: kills a random pod/replica every Tuesday at 03:00 UTC and pages only the responsible on-call engineer.",
    stack: ["Litmus", "Argo Workflows", "SLACK webhooks", "Terraform"],
    status: "RUNNING — 9 MONTHS",
  },
  {
    name: "budget-burn",
    summary: "Error budget dashboard with predicted burn-to-expiry and auto-generated incident candidates before the pager decides for you.",
    stack: ["Prometheus Rules", "Go", "Grafana", "S3"],
    status: "INTERNAL TOOL",
  },
  {
    name: "infra-monorepo",
    summary: "One repo, one plan: 100% of Terraform modules, DRY policies, and drift detection in a single review flow.",
    stack: ["OpenTofu", "OPA", "Atlantis", "GitHub Actions"],
    status: "1.2K COMMITS / 4 REGIONS",
  },
];

export const METRICS = {
  slo: "99.95",
  window: "30 DAY ROLLING",
  uptimeNow: "99.982",
  p99: "128ms",
  p95: "74ms",
  reqRate: "14.2k /s",
  errorBudgetRemaining: "0.041",
  burnUnit: "% / 30d",
  series: [28, 30, 27, 31, 29, 33, 30, 28, 31, 34, 30, 29, 32, 36, 31, 30, 33, 29, 28, 30, 31, 30, 32, 34, 30, 29, 31, 33, 30, 32],
};

export const CONTACT = {
  email: "sr0.operator@example.com",
  github: "https://github.com/sr0-operator",
  linkedin: "https://www.linkedin.com/in/sr0-operator",
  availability: "OPEN TO PLATFORM-LEAD & PRINCIPAL SRE ROLES — REMOTE OK",
};
```

- [ ] **Step 3: Build the pages**

`src/pages/index.astro`:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import { SITE } from "../data/site";
---
<BaseLayout title={`Home — ${SITE.role}`}>
  <article class="content-panel" data-page="home">
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
    <p class="hint">AIM &amp; CLICK A NODE TO NAVIGATE.</p>
  </article>
</BaseLayout>
```

`src/pages/experience.astro`:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import { EXPERIENCE } from "../data/site";
---
<BaseLayout title="Experience — Senior DevOps/SRE Engineer">
  <section class="content-panel" data-page="experience">
    <p class="kicker">02 / EXPERIENCE</p>
    {EXPERIENCE.map((role) => (
      <article class="role" key={role.company}>
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
</BaseLayout>
```

`src/pages/platform.astro`:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import { SKILLS } from "../data/site";
---
<BaseLayout title="Platform — Senior DevOps/SRE Engineer">
  <section class="content-panel" data-page="platform">
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
</BaseLayout>
```

`src/pages/projects.astro`:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import { PROJECTS } from "../data/site";
---
<BaseLayout title="Projects — Senior DevOps/SRE Engineer">
  <section class="content-panel" data-page="projects">
    <p class="kicker">04 / PROJECTS</p>
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
</BaseLayout>
```

`src/pages/metrics.astro` (stub — full gauges in Task 6):

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import { METRICS } from "../data/site";
---
<BaseLayout title="Metrics — Senior DevOps/SRE Engineer">
  <section class="content-panel" data-page="metrics">
    <p class="kicker">05 / METRICS (LIVE FEED SNAPSHOT)</p>
    <div class="metric-grid">
      <div class="metric-cell"><span class="metric-label">SLO</span><span class="metric-value">{METRICS.slo}%</span></div>
      <div class="metric-cell"><span class="metric-label">UPTIME NOW</span><span class="metric-value">{METRICS.uptimeNow}%</span></div>
      <div class="metric-cell"><span class="metric-label">P99</span><span class="metric-value">{METRICS.p99}</span></div>
    </div>
  </section>
</BaseLayout>
```

`src/pages/contact.astro`:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import { CONTACT } from "../data/site";
---
<BaseLayout title="Contact — Senior DevOps/SRE Engineer">
  <section class="content-panel" data-page="contact">
    <p class="kicker">06 / CONTACT</p>
    <p class="tagline">{CONTACT.availability}</p>
    <dl class="contact-list">
      <div><dt>EMAIL</dt><dd><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></dd></div>
      <div><dt>GITHUB</dt><dd><a href={CONTACT.github} target="_blank" rel="noreferrer">{CONTACT.github}</a></dd></div>
      <div><dt>LINKEDIN</dt><dd><a href={CONTACT.linkedin} target="_blank" rel="noreferrer">{CONTACT.linkedin}</a></dd></div>
    </dl>
  </section>
</BaseLayout>
```

- [ ] **Step 4: Content styles (append to global.css)**

```css
.kicker {
  font-size: 11px;
  letter-spacing: 0.2em;
  color: var(--muted);
  margin: 0 0 18px;
}

.content-panel {
  margin: 88px 24px 24px 24px;
  max-width: 860px;
  padding: 28px;
  overflow-y: auto;
  max-height: calc(100vh - 150px);
}

.content-panel h1 {
  font-size: clamp(28px, 5vw, 44px);
  letter-spacing: 0.02em;
  margin: 0 0 14px;
}

.content-panel h2 {
  font-size: 18px;
  letter-spacing: 0.06em;
  margin: 0 0 8px;
}

.tagline {
  color: var(--muted);
  font-size: 14px;
  line-height: 1.65;
  max-width: 58ch;
}

.hairline {
  height: 1px;
  background: var(--divide);
  margin: 22px 0;
}

.stat-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1px;
  background: var(--divide);
  border: 1px solid var(--divide);
  margin: 0;
}

.stat-strip > div {
  background: var(--panel);
  padding: 12px;
}

.stat-strip dt,
.metric-label {
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--muted);
}

.stat-strip dd,
.metric-value {
  font-size: 20px;
  margin: 6px 0 0;
  font-weight: 700;
}

.hint {
  font-size: 10px;
  letter-spacing: 0.18em;
  color: var(--muted);
  margin-top: 22px;
}

.role {
  border-top: 1px solid var(--divide);
  padding: 20px 0;
  display: grid;
  gap: 12px;
}

.role-meta {
  color: var(--muted);
  font-size: 12px;
  letter-spacing: 0.1em;
}

.role-stack,
.project-stack {
  color: var(--muted);
  font-size: 10px;
  letter-spacing: 0.12em;
}

.role-points {
  margin: 0;
  padding-left: 18px;
}

.role-points li {
  margin: 8px 0;
  line-height: 1.55;
  font-size: 13px;
}

.skill-group {
  border-top: 1px solid var(--divide);
  padding: 14px 0;
}

.skill-tags {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-tags li {
  border: 1px solid var(--divide);
  padding: 4px 10px;
  font-size: 12px;
}

.project {
  border-top: 1px solid var(--divide);
  padding: 18px 0;
}

.project-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.project-status {
  font-size: 10px;
  letter-spacing: 0.12em;
  color: var(--muted);
  white-space: nowrap;
}

.project-summary {
  font-size: 13px;
  line-height: 1.6;
  margin: 10px 0;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1px;
  background: var(--divide);
  border: 1px solid var(--divide);
}

.metric-cell {
  background: var(--panel);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-value {
  font-size: 26px;
}

.contact-list {
  display: grid;
  gap: 1px;
  background: var(--divide);
  border: 1px solid var(--divide);
  margin: 0;
}

.contact-list > div {
  background: var(--panel);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-list dt {
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--muted);
}

.contact-list dd {
  margin: 0;
}

.contact-list a {
  color: var(--fg);
  text-underline-offset: 4px;
}
```

- [ ] **Step 5: Run check + build + content tests**

Run: `npm run check && npm run build && npm test -- tests/content.spec.ts`
Expected: PASS — six routes each render an element with the matching `data-page` attribute and the page-specific marker text; the hub click for PROJECTS (top-right hub at `0.88, 0.26`) navigates to real content. Fix any `astro check` errors (e.g., the experience list block, unescaped `&`) until green.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: six content pages backed by typed SRE data"
```

---

### Task 6: Metrics gimmick page gauges

Replace the stub Metrics page with brutalist instrument panels: SLO headline, error-budget burn bar, a p99 latency gauge, and a request-rate sparkline drawn on a small canvas by an inline vanilla script. Blinking status light respects reduced-motion.

**Files:**
- Modify: `src/pages/metrics.astro`, `src/styles/global.css`
- Test: `tests/metrics.spec.ts`

**Interfaces:**
- Consumes: `METRICS` from `src/data/site.ts`
- Produces: `.sparkline` canvas 300×80; `.burn-bar` 0–100%; `.led` status light; data stays static-per-render (no live feeds)

- [ ] **Step 1: Write the failing metrics test**

`tests/metrics.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("metrics page shows instrument panels and a drawn sparkline", async ({ page }) => {
  await page.goto("/metrics");
  await expect(page.locator('[data-page="metrics"]')).toBeVisible();
  await expect(page.locator(".metric-value").first()).toContainText("99.95");

  const lit = await page.locator("canvas.sparkline").evaluate((canvas) => {
    const c = canvas as HTMLCanvasElement;
    const ctx = c.getContext("2d")!;
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    let pixels = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) pixels++;
    return pixels;
  });
  expect(lit).toBeGreaterThan(500);

  await expect(page.locator(".led")).toBeVisible();
});

test("led does not pulse under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/metrics");
  const animated = await page.locator(".led").evaluate((el) => {
    return getComputedStyle(el).animationName !== "none";
  });
  expect(animated).toBe(false);
});
```

Run: `npm test -- tests/metrics.spec.ts` — expect FAIL (stub has no sparkline/led).

- [ ] **Step 2: Replace src/pages/metrics.astro**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import { METRICS } from "../data/site";
const seriesJson = JSON.stringify(METRICS.series);
---
<BaseLayout title="Metrics — Senior DevOps/SRE Engineer">
  <section class="content-panel" data-page="metrics">
    <p class="kicker">05 / METRICS — LIVE FEED SNAPSHOT</p>

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

- [ ] **Step 3: Metrics styles (append to global.css)**

```css
.metric-cell-wide {
  grid-column: span 2;
}

.metric-hero {
  font-size: 44px;
  line-height: 1;
}

.metric-note {
  font-size: 10px;
  letter-spacing: 0.14em;
  color: var(--muted);
}

.burn-bar {
  height: 8px;
  background: var(--divide);
  border: 1px solid var(--divide);
  position: relative;
}

.burn-fill {
  height: 100%;
  width: var(--burn, 0%);
  background: var(--fg);
}

.led {
  width: 10px;
  height: 10px;
  border: 1px solid currentColor;
  background: currentColor;
  animation: led-pulse 2s ease-in-out infinite;
}

@keyframes led-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
}

.sparkline {
  width: 100%;
  height: auto;
  display: block;
  color: var(--fg);
  border-top: 1px solid var(--divide);
  margin-top: 10px;
}

@media (prefers-reduced-motion: reduce) {
  .led {
    animation: none;
  }
}
```

- [ ] **Step 4: Verify**

Run: `npm run check && npm run build && npm test -- tests/metrics.spec.ts tests/content.spec.ts`
Expected: PASS — sparkline draws >500 pixels; LED visible; LED animation-name is `none` under reduced motion.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: metrics page with brutalist SRE gauges"
```

---

### Task 7: Full regression suite, persistence guard, and guardrail checks

Lock in the guarantees: constellation does not restart across navigation, mode persists, no console errors anywhere, mobile rows, reduced-motion static field, plus a hash regression for the 8 authored HTML sources. Final lint/typecheck/build green.

**Files:**
- Create: `tests/regression.spec.ts`, `scripts/verify-hashes.mjs`
- Modify: `package.json` (add `"verify": "node scripts/verify-hashes.mjs"`), `tests/menu.spec.ts` (keep), nothing else
- Test: `tests/regression.spec.ts`

**Interfaces:**
- Consumes: everything from Tasks 1–6
- Produces: CI-style pass: `npm run verify && npm run check && npm run lint && npm run build && npm test`

- [ ] **Step 1: Write the failing regression test**

`tests/regression.spec.ts`:

```ts
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
    c.dispatchEvent(
      new MouseEvent("click", {
        clientX: Math.min(window.innerWidth * 0.88, window.innerWidth),
        clientY: window.innerHeight * 0.74,
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
    c.dispatchEvent(
      new MouseEvent("click", {
        clientX: window.innerWidth * 0.12,
        clientY: window.innerHeight * 0.5,
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
```

Run: `npm test -- tests/regression.spec.ts`
Expected: FAIL — the nonce check fails (the persisted island / iframe is being recreated during navigation). This drives the stabilization fix in Step 2.

- [ ] **Step 2: Stabilize the island so the iframe is carried, not recreated**

The nonce test's failure mode is a recreated iframe (`contentWindow` replaced). The persistence chain is: Astro's `transition:persist` carries the `astro-island` element across navigation → React reconciliation reuses the same `<ConstellationField>` → the iframe DOM node and its `srcdoc` (a memoized, unchanged string) are reused → `contentWindow` survives.

Give the persisted island a stable DOM identity so Astro's transition system consistently matches it across routes. In `src/components/ConstellationMenu.tsx`, change the root div:

```tsx
  return (
    <div
      id="constellation-menu-root"
      className={`effect-frame site-constellation ${transitioning ? "is-transitioning" : ""}`}
      data-mode={mode}
    >
```

Keep `menuScript` memoized (already: `useMemo(() => buildMenuScript(NAV_SECTIONS), [])`) and keep the effect props constant except `mode` (already the case in Task 3) — `menuScript`, `speed`, `size`, `strokeWidth`, `length`, `density`, `opacity`, `hue`, `saturation`, `brightness` and `suffixScript` are stable string/number literals. That keeps `srcDoc` identical across navigations so the iframe is never set to a fresh doc.

Re-run the nonce/persistence tests after this edit. If the nonce still fails, do not invent new props (`srcDocOverride` does not exist in the module) — instead capture the iframe before/after in a one-off Playwright eval to confirm whether the island or just the message listener is being replaced, and address the concrete cause (e.g. wrap the constant effect props in `useMemo` with `[]` deps in `ConstellationMenu`).

- [ ] **Step 3: Add the source hash regression script**

The hashes below are the verified authored sources from the skill's revision `SHA-256 1920ad4fe34f` (already confirmed byte-for-byte in this repo — the 41-byte files in `sources/` are host-created placeholders and are intentionally not in this list).

`scripts/verify-hashes.mjs`:

```js
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";

const EXPECTED = {
  "src/effects/constellation-field/sources/constellation-field.html": "1920ad4fe34f2ed2348e3a52110c37b4969bc45d71ff29f2738cb4542ad9f610",
  "src/effects/constellation-field/sources/particle-drift.html": "7fad6cc8c54c0385c472c2879762b3fd2bfb061820bf925034d7a58a0048eb27",
  "src/effects/constellation-field/sources/particle-network.html": "bc7bffdc48a9019cbba937dab9d335b85f20ac8a472f10dfa3d553da439cfdb7",
  "src/effects/constellation-field/sources/gateway-flow.html": "c5a1de43138ffba96b9f0ecdcf3c054ae251ec94344e88c6ad502bae362b17d0",
  "src/effects/constellation-field/sources/connectivity-graph.html": "98592824dd1109702cd72e9deca1cae7239169396c8245e8bbd786997d9bdf13",
  "src/effects/constellation-field/sources/interface-lines.html": "608cbc6976996b8a5b6c4aaba4bee4d6f2dd44579b819df45914f35bc310d2cc",
  "src/effects/constellation-field/sources/defense-lines.html": "1cd230f6a060023f99cbbe9ebc63e37409bf7ed70507e1ef44edc2342a0b9f91",
  "src/effects/constellation-field/sources/topo-field.html": "70dbdaaec6398be9fcf05843f6c5af65e761d29187e60064673bbeb55888379f",
};

let failed = false;
for (const [file, expected] of Object.entries(EXPECTED)) {
  const data = readFileSync(file);
  const hash = createHash("sha256").update(data).digest("hex");
  if (hash !== expected) {
    console.error(`HASH MISMATCH: ${file}`);
    console.error(`  expected ${expected}`);
    console.error(`  actual   ${hash}`);
    failed = true;
  } else {
    console.log(`ok ${file} (${statSync(file).size} bytes)`);
  }
}
if (failed) process.exit(1);
console.log(`verified ${Object.keys(EXPECTED).length} authored sources`);
```

- [ ] **Step 4: Wire hash verification into package.json**

```json
"verify": "node scripts/verify-hashes.mjs"
```

- [ ] **Step 5: Run the full gate**

Run: `npm run verify && npm run check && npm run lint && npm run build && npm test`
Expected: ALL green — memory-note: hub nav in `tests/regression.spec.ts` uses the CONTACT hub (0.88, 0.74); ensure the click's `clientX/clientY` clamp keeps it inside the viewport (it is: `Math.min(x, innerWidth)`).

With every Playwright suite file passing and zero console errors, this task's deliverable is the full passing gate.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test: regression suite, persistence guard, and source hash verification"
```

---

## Self-review notes (filled during planning)

- **Spec coverage:** architecture (Task 1, 3–4), suffix injection (Task 2), menu runtime + nav (Task 3), persistence + mode (Task 3, 7), brutalist tokens + mobile nav row + reduced-motion CSS (Task 4), 6 content routes (Task 5), metrics gauges (Task 6), verification incl. persistence/no-reload/console-clean/reduced-motion/hashes (Task 7). The metrics content icons/decoration are omitted per brutalist flavor.
- **Type consistency:** `ConstellationMenuSection`, `NAV_SECTIONS`, `buildMenuScript`, `suffixScript?: string`, `MODE_STORE` are the cross-task contracts; `data-page` values match routes; hub click coordinates in tests mirror `NAV_SECTIONS` (0.12/0.88 columns, 0.26/0.5/0.74 rows).
- **Known risks flagged for executor:** (1) `transition:persist` + island persistence must keep the iframe alive — Task 7 nonce test is the arbiter, with the `id="constellation-menu-root"` stabilization step ready; (2) `astro check` strictness may flag the inline page map closures or `as never` event casts — fix per compiler output; (3) dev `npm test` builds `dist` first via webServer command — first run is slow (~1min).