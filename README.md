# wissamataleh.github.io

Personal portfolio of Wissam Ataleh — a senior DevOps & Site Reliability Engineer. A brutalist scroll-deck website built on a live Canvas 2D + WebGL constellation field: scroll to navigate the deck, or aim and click a connecting node.

Live at **[https://wissamataleh.github.io](https://wissamataleh.github.io)**

## Stack

- [Astro](https://astro.build) — static site generation
- [React 19](https://react.dev) — header/menu UI
- Canvas 2D + Raw WebGL — rendered constellation field effect
- [Playwright](https://playwright.dev) — end-to-end tests
- [Oxlint](https://oxc.rs/docs/guide/usage/linter) — linting
- Deployed via GitHub Actions to GitHub Pages

## Commands

- `npm run dev` — start the Astro dev server
- `npm run build` — build the static site to `dist/`
- `npm run preview` — preview the production build
- `npm test` — run the Playwright end-to-end suite
- `npm run check` — type-check with `astro check`
- `npm run lint` — lint with Oxlint
- `npm run verify` — verify the 8 authored effect sources remain unmodified

## Layout

```
.
├── .github/workflows/     # GitHub Actions deploy to GitHub Pages
├── docs/                  # design specs & implementation plans
├── public/                # favicon, downloadable CV PDF
├── scripts/
│   └── verify-hashes.mjs  # verifies the authored effect sources are unmodified
├── src/
│   ├── components/
│   │   ├── ConstellationMenu.tsx   # header, controls, rail, route wiring
│   │   └── menu/menuScript.ts      # hub positions & canvas menu script
│   ├── data/
│   │   └── site.ts                 # all site content (persona, experience, projects…)
│   ├── effects/constellation-field/
│   │   ├── ConstellationField.tsx  # Canvas 2D + WebGL wrapper
│   │   ├── NeuformBatchEffects.tsx # effect runtime
│   │   ├── sources/                # the 8 authored effect sources (verified, not edited)
│   │   └── styles.css
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro             # the scroll-deck home page
│   │   └── 404.astro
│   └── styles/
│       └── global.css               # design tokens, deck & chrome styles
├── tests/                    # Playwright end-to-end suite
├── astro.config.mjs
├── package.json
├── playwright.config.ts
└── tsconfig*.json
```

## Contact

- Email: [wissam_ataleh@outlook.com](mailto:wissam_ataleh@outlook.com)
- GitHub: [github.com/wissamataleh](https://github.com/wissamataleh)
- LinkedIn: [linkedin.com/in/wissamataleh](https://www.linkedin.com/in/wissamataleh)
- CV: [WISSAM-ATALEH-DEVOPS-SRE-CV.pdf](/WISSAM-ATALEH-DEVOPS-SRE-CV.pdf)