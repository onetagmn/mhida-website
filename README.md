# MHIDA Website

Website for **MHIDA** (Mongolian Health Insurance Doctors Association / Монголын Эрүүл Мэндийн Даатгалын Эмч Нарын Холбоо), built to replace the current Jotform-based setup at **mhida.org**.

Built with [Next.js](https://nextjs.org) (App Router) + [Tailwind CSS](https://tailwindcss.com), bilingual Mongolian/English throughout.

## Status: Phase 1 — Foundation

This is the **site shell**: Home, About, Trainings (AXIS Card / e-Health), Legal Acts, Contact, and a Register placeholder. Sections that depend on later phases (registration form, login, live member map, QPay payments) are clearly marked with a **"Draft content" / "Coming soon"** badge — see `src/components/DraftNotice.tsx`.

Planned phases (see the original project brief for full detail):

1. **Foundation** — site shell (this repo, current state)
2. Registration + accounts (province dropdown, membership tiers)
3. Login + member dashboard
4. English course integration (gated behind login)
5. Live member map (auto-plotted from real registration data)
6. QPay payment integration

## Getting started locally

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run start   # run the production build locally
npm run lint    # eslint
```

## Project structure

```
src/
  app/                  Pages (App Router) — one folder per route
    about/
    contact/
    legal/
    register/
    trainings/
      axis-card/
      e-health/
  components/           Navbar, Footer, PageHeader, DraftNotice
  lib/
    language-context.tsx  Bilingual MN/EN toggle (React context, no i18n library)
public/
  logo.png, logo-*.png, favicon.ico   MHIDA brand mark, exported from the source .wmf logo
  docs/                 TIHTC partner training flyers (PDF)
```

### Bilingual content

There's no external i18n library — every piece of text is passed through the `t(mongolian, english)` helper from `useLanguage()`:

```tsx
const { t } = useLanguage();
t("Нүүр", "Home");
```

The visitor's language choice is remembered in `localStorage` (`mhida-lang`), defaulting to Mongolian.

### Brand

Colors are sampled directly from the official logo and defined as CSS variables in `src/app/globals.css`:

- `--brand-blue: #015196`
- `--brand-red: #c42730`

Font is **Noto Sans** (self-hosted via `@fontsource/noto-sans`, both Latin and Cyrillic subsets) rather than fetched from Google Fonts at build time — this keeps builds working without a live network dependency and avoids a runtime dependency on Google's font CDN.

## Deploying

Recommended setup: **GitHub** (source control) → **Netlify** (hosting + build) → custom domain `mhida.org` pointed at Netlify via DNS.

1. Push this repo to a GitHub repository.
2. In Netlify: "Add new site" → "Import an existing project" → connect the GitHub repo. Build command `npm run build`, publish handled automatically by Netlify's Next.js runtime.
3. In Netlify's domain settings, add `mhida.org` as a custom domain and follow the DNS instructions (typically an A/ALIAS record or CNAME at your domain registrar, alongside `www.mhida.org`).
4. Keep the current Jotform app running until this site is ready, then cut over DNS.

## Outstanding items (from the project brief)

- [x] Logo files
- [ ] GIF files for the homepage (not yet supplied)
- [ ] Member list column structure (Google Sheet — connecting via Google Drive next)
- [ ] QPay merchant account (user to set up in parallel)
