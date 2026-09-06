# Scroll-Deck Navigation Design

Date: 2026-09-07
Status: Proposed (awaiting review)

## Context

The site is currently an Astro multi-page app (six routes rendered via Astro
View Transitions crossfades) where navigation happens only through the
constellation menu. The owner wants **scroll-driven navigation**: scrolling
down reveals the next "page" (route section) sliding into view, while each
content box may still scroll internally when its content is longer than the
viewport.

Root cause of the earlier scroll-reveal attempt: at a typical 1440x900
viewport, five of six routes do not overflow their content panel, so there was
nothing to scroll-reveal. The requested behavior is therefore a change of
navigation model, not a content animation.

## Goals

- Remove crossfade/route navigation from the primary flow.
- Render all six sections as a vertical deck on a single route (`/`).
- Scrolling moves between sections; each section is a full viewport tall.
- Proximity scroll snapping so each page settles into (slides into) full view.
- The URL hash follows the current section (`#/experience`, `#/projects`, …)
  so deep links, bookmarks, and back/forward work.
- The constellation remains fixed behind the content; hubs still clickable and
  the active section is highlighted in the field.
- Each `.content-panel` still scrolls internally when its content exceeds the
  viewport.
- Dark/light mode toggle and persistence continue to work.
- Reduced-motion preference respected (no smooth scrolls, content still
  reachable by scrolling).

## Non-goals

- No per-block "reveal animation" (superseded by whole-page slides).
- No wheel-to-route transitions; the deck is one scrollable document.
- No changes to ConstellationField source or the authored effect HTML.
- No refactor of mode toggling beyond what the below design requires.

## Design

### 1. Deck layout

`index.astro` renders six sections in NAV order, one per route, in the order
defined by `NAV_SECTIONS`:

1. home — `data-page="home"` (article, kicker `SR0.OPERATOR // SUISSE`)
2. experience — `data-page="experience"` (kicker `02 / EXPERIENCE`)
3. platform — `data-page="platform"` (kicker `03 / PLATFORM & SKILLS`)
4. metrics — `data-page="metrics"` (kicker `04 / METRICS — LIVE FEED SNAPSHOT`)
   *(renumbered from 05; see "Kicker renumbering" below)*
5. contact — `data-page="contact"` (kicker `05 / CONTACT`)
   *(renumbered from 06)*
6. projects — `data-page="projects"` (kicker `06 / PROJECTS`)
   *(renumbered from 04)*

Each section:

- `height: 100vh;`
- `scroll-snap-align: start;`
- `position: relative;`
- `pointer-events: none` with `.content-panel { pointer-events: auto }` — the
  section is transparent chrome so the fixed constellation canvas stays
  hoverable/clickable everywhere except over the panels.

The other route files (`experience.astro`, `platform.astro`, `metrics.astro`,
`contact.astro`, `projects.astro`) are deleted; their markup and imports move
into `index.astro`. `404.astro` stays as a real route (it uses `.bio-panel`,
unaffected). All routes' content still comes from `src/data/site.ts`.

### 2. Scrolling model

- Remove `overflow: hidden` from `body` and from `.site-content` so the
  document itself is the scroller.
- `html { scroll-snap-type: y proximity; }`.
- `html { scroll-behavior: smooth; }` for programmatic navigation scrolls;
  explicit `behavior: "instant"` is used wherever an immediate jump is needed
  (initial deep link, scroll-spy hash application).
- `.content-panel` keeps `max-height: calc(100vh - 150px); overflow-y: auto;`
  — its own nested scroller. Nested-scroll chaining gives the intended feel:
  a wheel over a panel fills/empties that panel, then the deck continues.
- One section = exactly one viewport height, so `scrollTop ≈ index × innerHeight`.

### 3. Hash routing + scroll-spy

Client (in `ConstellationMenu.tsx`):

- A passive `scroll` listener on `document.scrollingElement` computes
  `index = clamp(Math.round(scrollTop / innerHeight))`. When `index` changes:
  - `history.replaceState(null, "", "#" + NAV_SECTIONS[index].href)` (hash as
    `/experience` — i.e. `#/experience`), preventing history spam.
  - update React `activeHref`/index (drives `.site-index`, `.site-nav`
    `.is-active`, `.site-rail`).
  - post `{ type: "constellation-route", href }` to the iframe so the field
    highlights the current hub.
  - On `resize`, re-evaluate the index (sections are 100vh; a resize changes
    `index × innerHeight` spacing) and reapply the snap position.

- On initial load, if `location.hash` matches a NAV section, scroll instantly
  to that index (`window.scrollTo({ top: index * innerHeight, behavior:
  "instant" })`) and set `activeHref`.
- `hashchange` listener scrolls to the matching section (back/forward).
- `sendBounds()` continues to run after load and on resize (unchanged
  handshake); with all six panels in the DOM, the measured right edge is the
  same for each, so the hub `minX` clamp is unchanged.

### 4. Navigation sources (all become scroll-to)

- Constellation hub click → `{ type: "constellation-nav", href }` → host finds
  the NAV index for `href` and `window.scrollTo({ top: index * innerHeight,
  behavior: prefersReducedMotion ? "instant" : "smooth" })`; the scroll-spy
  then updates hash + active state (single source of truth). If already at
  that index, no-op.
- `.site-name` and `.site-nav` links: `preventDefault` + scroll to section;
  the `href` attributes remain for semantics.
- `astro:transitions/client` `navigate` and Astro `<ClientRouter />` are
  removed (no more real route transitions). The `transition:persist` attribute
  on the menu island is removed as it is no longer needed.
- The `astro:page-load` listeners in the island and the reveal script in
  `BaseLayout` are removed.

### 5. Field feedback for the active section

In `menuScript.ts` RUNTIME:

- Add an `active` index (`-1` initially).
- Listen for `{ type: "constellation-route", href }`; set `active` to the
  matching hub index.
- `drawHubs` treats `hover || active` hubs as "on" (halo + full opacity core)
  so the current page is always lit in the field.
- Keep all existing behavior: `constellation-ready`/`constellation-bounds`
  handshake, drift physics, `hit()`, cursor, labels, `__CF_*` debug globals.

### 6. Header chrome

- `.site-bar` stays fixed (z-index 20) with `.site-index` (`NN/06`), the
  dark/light toggle, `.site-name`, and (mobile-only) `.site-nav`.
- `.site-rail` stays fixed bottom-left.
- Mode toggle logic (`switchMode`/timers) is unchanged.

### 7. Kicker renumbering

NAV order is the single source of truth: experience=02, platform=03,
metrics=04, contact=05, projects=06. The existing route kickers disagreed
(projects=04, metrics=05, contact=06); the consolidated deck uses the NAV
indices.

### 8. Reduced motion

`@media (prefers-reduced-motion: reduce)`:

- `html { scroll-behavior: auto; }` (no smooth programmatic scrolls).
- Existing `transition: none` overrides remain.
- Content is fully reachable: scrolling and internal panel scroll still work;
  only the smoothing is disabled.

## Files touched

- `src/pages/index.astro` — render the six-section deck (all data imports).
- `src/pages/{experience,platform,metrics,contact,projects}.astro` — deleted.
- `src/layouts/BaseLayout.astro` — remove `<ClientRouter />` and the reveal
  `IntersectionObserver` script.
- `src/components/ConstellationMenu.tsx` — scroll-spy + hash routing, remove
  `navigate`, `astro:page-load` listeners, `transition:persist`.
- `src/components/menu/menuScript.ts` — RUNTIME `active` + `constellation-route`
  highlight; `buildMenuScript` signature unchanged.
- `src/styles/global.css` — document scroller + snap; deck section styles;
  `pointer-events` split (sections none, panels auto); remove the `.js-reveal`
  block; reduced-motion rules.
- `tests/*` — see Test plan.
- `docs/superpowers/specs/2026-09-07-scroll-deck-navigation-design.md` — this
  spec.

## Test plan

Rewrite route-dependent specs for the deck; preserve the existing green
behaviors:

- `tests/menu.spec.ts` — hub click scrolls to the matching section (assert
  `scrollY` ≈ index × viewport + hash becomes `#/experience`); label click
  works; hover glow; retina canvas; connected hub lines; active hub lit after
  scroll.
- `tests/chrome.spec.ts` — six nav entries; mobile nav available.
- `tests/content.spec.ts` — all six `[data-page]` sections exist on `/`; each
  section's marker text appears when scrolled to it; home stat strip present;
  a `.content-panel` taller than the viewport scrolls internally without
  changing the deck index.
- `tests/regression.spec.ts` — nonce/`__CF_HUB_COUNT` (6) unchanged; mode
  persists when scrolling between sections; reduced-motion freezes the field
  but menu/reveal still sane; console-clean while scrolling through the whole
  deck; deep link `/#/projects` opens scrolled to projects.
- `scripts/verify-hashes.mjs` — unchanged (no authored effect edits).
- `npm run check`, `npm test`, `npm run verify` all green.

## Edge cases

- **Initial scroll-spy races**: the spy runs after first paint; the initial
  `activeHref` is derived from the URL hash if present, else `/`.
- **Resize with a non-first section active**: recompute index from
  `scrollTop / innerHeight` and resnap (sections are exactly 100vh).
- **Wheel over panel vs deck**: nested scroller chaining (panel first, then
  deck). Snapping applies to the document scroller only.
- **Old standalone route URLs** (`/projects`, `/experience`, …) no longer
  exist — they 404 (range pages deleted). Nothing on the site links to them
  anymore; deep links are `/#/projects` style. Acceptable, and part of this
  change.
- **iOS/touch**: `pointer-events: none` sections fall through for touch too;
  panning over the field scrolls the deck, panning inside a panel scrolls the
  panel.

## Risks / rollback

- The biggest behavioral change is single-route hosting; if scroll-spy or hash
  handling misbehaves, fallback is the classic multi-route layout (prior
  commit). All changes are conventional commits; rollback = revert.
- Console-clean guarantees for the deck are enforced by the rewritten
  regression spec.