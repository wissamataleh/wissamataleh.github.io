# Constellation Brutalist Portfolio — Design

Date: 2026-09-06
Status: Approved (2026-09-06)
Type: Architecture / new site build on top of existing Constellation Field effect

## Context

The destination project (`constellation-field/`) currently hosts a Vite + React 19 + TS app whose only feature is the **Constellation Field** effect — an iframe-sandboxed Canvas 2D particle network with a collection of 8 selectable variants, dark/light modes (dark=`#50A0F0` blue field, light=`#B8860B` gold field), a phase-driven dark↔light dissolve transition, and host-side hue/saturation/brightness controls.

Goal: turn this into a **modern brutalist portfolio website** for a **Senior DevOps/SRE Engineer**, where the constellation's dots act as a clickable main menu. Content is dummy but on-topic (DevOps/SRE roles, skills, projects, fake live metrics).

## Decisions (agreed)

- **Approach A**: Astro static MPA + React island for the effect; `astro:transitions` `ClientRouter` provides SPA-mode view-transition navigation; `navigate()` from `astro:transitions/client` drives programmatic nav from the constellation menu.
- **Navigation model**: hybrid — one real route per section, with crossfade via View Transitions.
- **Aesthetic**: classic brutalist — near-monochrome (`#070914` night / `#eef1f6` paper), strict 1px hairlines, exposed grid structure, hard corners, monospace type, sparse color (only the constellation is "color").
- **Constellation persists across pages** via `transition:persist` on the island — the field and its animation keep running through navigation without a restart.
- **Hub coordinates**: decided visually during build.
- **Persona**: placeholder "Senior DevOps/SRE Engineer"; no invented name/brand.

## Architecture

### Project layout (Astro)

```
constellation-field/
  astro.config.mjs          # @astrojs/react integration + static output
  package.json              # astro, @astrojs/react, react, react-dom
  tsconfig.json
  public/favicon.svg
  src/
    layouts/
      BaseLayout.astro      # html shell, <ClientRouter />, shared chrome,
                            # persistent ConstellationMenu island + content slot
    components/
      ConstellationMenu.tsx # React island (client:load, transition:persist)
                            # owns mode state, mode toggle, field, and the
                            # constellation-nav message -> navigate() bridge
    pages/
      index.astro           # Home
      experience.astro      # Experience
      platform.astro        # Platform & Skills
      projects.astro        # Projects
      metrics.astro         # Metrics (gimmick SRE page)
      contact.astro         # Contact
    effects/constellation-field/   # copied verbatim from current app
      ConstellationField.tsx
      NeuformBatchEffects.tsx
      sources/*.html
      styles.css (adapted: brutalist chrome + effect-frame + transition)
    data/
      site.ts               # all dummy content, typed
    styles/
      global.css            # brutalist design tokens & base styles
```

- Vite React scaffold is replaced by Astro. The `effects/constellation-field` module moves over unchanged except for any host-boundary adaptations described below.

### The clickable constellation menu (core novel piece)

The sandboxed effect iframe (opaque origin) cannot be introspected from the host, and hover/click intent on individual nodes cannot be read cross-origin. We reuse the **srcdoc script-injection mechanism the effect already has**: `buildFocusedDocument` (NeuformBatchEffects.tsx:688) appends `controlScript` (data-threeui-controls) + `focusStyle` into `<head>` and `focusScript` (data-threeui-focus) before `</body>`. The host supplies one generic optional **suffix script** appended before `</body>` (after `focusScript`) — the entire menu layer is host-authored and applied purely via that injection. The verified `.html` sources are never edited; non-menu usage of `ConstellationField` is byte-unchanged.

- Add one generic optional prop to `NeuformBatchEffectProps` (threads through `ConstellationFieldProps` → variant component → `NeuformBatchEffect` → `buildFocusedDocument`): `suffixScript?: string` (raw HTML appended before `</body>`). No menu knowledge enters the effect module.
- `ConstellationMenu.tsx` builds the `suffixScript` `<script data-threeui-menu>` from a typed `MenuSection[]` config and passes it together with `variant="constellation-field"`.

Runtime overlay mechanics (why this works, verified against the canonical source):
- The canonical source declares `nodes`, `width`, `height`, `initNodes`, `animateCanvas`, `pointer` as top-level classic-script bindings — globally visible to later injected scripts. The menu script runs after `focusScript`, so it can read/hook these directly.
- `initNodes()` re-creates the node array **on every `window.resize`** and calls itself on load. The menu script adds its own `resize` listener that re-pins hubs after the source's listener rebuilds `nodes` (registration order guarantees this).

Menu script behavior (all additive — the ambient renderer is untouched):
1. Pin the **first 6 nodes** as **hubs** to fixed normalized coordinates from the config (mapped to `width`/`height` at runtime), zeroing their velocity.
2. Ambient nodes (~79 desktop / ~40 mobile) keep exactly their authored drift, links, and pulse.
3. The menu script runs its own `requestAnimationFrame` overlay loop — registered after the source's loop, so it draws **after** each frame: hub glyphs as square "terminal" marks, labels in mono (`01 HOME`, `02 EXPERIENCE`, …), hover (pointer within hit radius) draws a hairline ring and brightens the label. Each frame it also snaps hub `x/y` back to their pinned coordinates, overriding drift/bounce/pointer-gravity for hubs (micro-jitter with links is imperceptible).
4. Canvas `click`/`mousemove` compute the nearest hub; a hit posts `parent.postMessage({ type: "constellation-nav", href })`.
5. Reduced motion: skip the overlay animation loop; draw hubs once statically (still hoverable/clickable) — matches the source's own reduced-motion path.
6. Does not interfere with `__SF_CONTROLS` speed/opacity messaging (stays live).

Host bridge (`ConstellationMenu.tsx`):
- Renders `<ConstellationField variant="constellation-field" suffixScript={menuScript} mode={mode} ...controls />`.
- Listens to `window "message"`, validates `event.data.type === "constellation-nav"` and a string `href`, then calls `navigate(href)` from `astro:transitions/client`.
- Owns `mode` state and the dark↔light toggle button (phase-dissolve transition preserved from the current app).
- Composes the brutalist chrome over the field: top hairline bar (site name, coordinates readout, section index `01/06`), mode toggle; content area sits above the field.

### Pages, routing, persistence

- Six routes: `/` (index), `/experience`, `/platform`, `/projects`, `/metrics`, `/contact`.
- `BaseLayout.astro`:
  - `<ClientRouter />` in `<head>` (site-wide SPA-mode view transitions).
  - `<ConstellationMenu client:load transition:persist />` — persists across navigation; the iframe element is moved, not recreated, so the field keeps animating.
  - `/main` content slot replaced per navigation; content crossfades via default Astro transition (name-matched elements where needed).
- Mode state lives inside the persisted island, so a dark↔light choice survives navigation.
- Deep links / fresh loads hydrate the island fresh (defaults to dark).

### Content (dummy, DevOps/SRE-aligned)

Typed in `src/data/site.ts`:
- `SITE` — role ("Senior DevOps/SRE Engineer"), email, GitHub, LinkedIn.
- `SECTIONS` — the 6 menu sections (id, label, href, hub coordinate, index).
- `EXPERIENCE` — 3 roles (current Senior SRE + two prior DevOps/SRE-esque roles), periods, stack tags, 3 impact bullets each.
- `SKILLS` — grouped toolbox: Kubernetes, Terraform/OpenTofu, Prometheus/Grafana, AWS/GCP, Argo CD / GitHub Actions, observability, incident response, SLOs, etc.
- `PROJECTS` — 3–4 plausible engineering artifacts (autoscaling pipeline, chaos lab, observability stack, IaC monorepo).
- `METRICS` — fake SRE numbers (SLO 99.95%, uptime, error budget, latency history) for the gimmick page.

### Metrics gimmick page

- Does not touch the constellation renderer.
- Pure HTML/CSS + one tiny `<canvas>` (or CSS bars) rendering dummy gauges: SLO % with error-budget burn, uptime, p99 latency, request-rate sparkline.
- Presented as brutalist instrument panels: hairline boxes, mono labels, blinking status light (respects reduced-motion).

## Visual system (brutalist tokens)

- Palette: `--night: #070914`, `--paper: #eef1f6`, ink `#eef1f6`/`#070914` inverted by mode; constellation is the only chromatic element (blue night / gold paper).
- Type: system monospace stack. Large-display sizes (clamp based) for headers.
- Rules: 1px hairlines everywhere, hard corners (no border-radius), no shadows (except neccessary layering of content over field), exposed section indices.
- Grid: 12 explicit columns, hairline vertical rules only *behind* content, never over the constellation hubs.
- Dark mode = blue field; light mode = gold field; toggle uses the existing phase-dissolve.

## Mobile & accessibility

- Coarse pointers / `<768px`: replace hub-hover as the primary affordance with a **minimal brutalist top nav row** (inline links) in the persistent chrome; the field remains ambient behind content.
- Hubs remain tappable where they are not under the content panel; the nav row guarantees reachability on small screens.
- `prefers-reduced-motion`: set field speed to 0 (already supported via `__SF_CONTROLS.speed`), disable view-transition + dissolve animations, disable the metrics blink.
- Keyboard: all nav reachable; hub nodes exposed with `aria-label`s; visible focus (brutalist border + underline).

## Error handling / robustness

- `navigate()` from a message is wrapped; if view transitions are unavailable the page bumps normally (Astro fallback `animate` default).
- Message handler validates `event.origin` shape / data type before acting.
- Menu script only activates when `suffixScript` is provided; otherwise the effect renders with zero additions.

## Testing & verification

Headless-browser suite (Playwright) against dev/preview server:
1. **Routes**: each of the 6 routes renders; content differs per route.
2. **Menu nav**: clicking each hub navigates to the correct route (URL changes, no full reload — transition present).
3. **Persistence**: constellation does NOT restart across navigation (sample iframe compute keepalive / no re-create).
4. **Dark↔light**: toggle flips the field colors (blue ↔ gold) with dissolve; persists across navigation.
5. **Mobile**: nav row present at mobile widths; hubs tappable; no horizontal overflow.
6. **Reduced-motion**: field static, transitions off in reduced-motion emulation.
7. **Errors**: zero console/page errors at every step.
8. **Teardown**: navigation/unmount releases listeners (message listener removed).

## Guardrails honored

- The `effects/constellation-field` sources (8 authored `.html`) remain unmodified; their hashes stay verifiable.
- Renderer behavior for non-menu nodes is preserved; the menu layer is host-boundary adaptation via the existing srcdoc-injection path.
- `ConstellationField` remains the public entry for the effect; variants still selectable.
- The only edit to `NeuformBatchEffects.tsx` beyond the existing per-mode color patch is the single additive optional `suffixScript` prop (defaulting to undefined / no behavior change). No authored rendering logic is altered.
- SSR/hydration safety (Astro islands pre-render on the server): the island's render is declarative (srcdoc string built from props — pure); all `window`/message wiring lives in `useEffect`/ref callbacks that run client-side only. The builder code is verified not to touch `window` during render before implementation.