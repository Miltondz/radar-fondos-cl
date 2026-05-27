# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server on port 3000 (0.0.0.0)
npm run build     # Production build
npm run lint      # TypeScript type check only (tsc --noEmit) — no ESLint
npm run preview   # Preview production build
npm run clean     # Delete dist/ and server.js
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

- `GEMINI_API_KEY` — required for Gemini AI; AI Studio injects this automatically
- `VITE_GOOGLE_CLIENT_ID` — optional; enables direct Google Calendar OAuth integration

`VITE_*` vars are exposed to client-side code via `import.meta.env`.

## Architecture

**Stack:** React 19 · Vite 6 · TypeScript · Tailwind CSS v4 · Motion (Framer Motion) · Lucide icons

**No router.** Navigation is a single `activeTab` state in `App.tsx` switching between 5 views:
`landing | financiamientos | licitaciones | hackatones | roadmap`

**All data is static** in `src/data.ts`. This is the only file to edit when adding or updating funding opportunities (funds, licitaciones, hackatones), roadmap steps, or document requirements. No backend, no API calls for data.

**Global state** lives in `App.tsx` and is persisted to `localStorage`:
| Key | Content |
|-----|---------|
| `milton_radar_theme` | `"light"` or `"dark"` |
| `milton_radar_profile` | `MiltonProfile` JSON |
| `milton_radar_stacked` | Array of fund IDs |
| `milton_radar_roadmap_ticks` | Array of completed step IDs |

**`MiltonProfile`** (`src/types.ts`) drives eligibility filtering across all views:
```ts
{ hasWoman, hasSpA, hasSales, hasSiiInitiated }
```
Each `Fund` has matching boolean eligibility fields (`eligibilityGenderRequired`, `requiresSpA`, `SIIRequired`, `eligibilitySalesRestricted`) used to compute applicability per profile.

**`Fund.type`** partitions data into tabs: `"financiamiento" | "licitacion" | "hackaton"`.

**`Fund.urgency`** drives visual priority: `"CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "CLOSED"`.

**`stackedFunds`** is the user's selected portfolio — funds added via "Agregar a Mi Stack" across views, managed in `App.tsx`, used in `ViewLanding` for comparison and total calculation.

## Key Files

| File | Purpose |
|------|---------|
| `src/data.ts` | All static data: `ALL_FUNDS`, `ROADMAP_STEPS`, `DOCUMENT_REQUIREMENTS`, `STRATEGIC_LINKS` |
| `src/types.ts` | All TypeScript types/interfaces/enums |
| `src/utils.ts` | `formatCLP()` and `getGoogleCalendarUrl()` helpers |
| `src/services/googleCalendar.ts` | Google Identity Services OAuth + Calendar API v3 integration |
| `src/App.tsx` | Root component: all state, tab routing, prop drilling to views |

## Styling

Tailwind v4 via `@tailwindcss/vite` plugin (no `tailwind.config.js`). Custom design tokens defined in `src/index.css`:
- `bg-paper`, `bg-paper-dark`, `text-ink` — base light/dark surface colors
- `bg-accent-green`, `bg-accent-blue`, `bg-accent-purple` — tab accent colors
- `text-alert`, `text-warning` — urgency/status colors

Dark mode uses Tailwind's `dark` class on `<html>` (toggled by `App.tsx`).

Path alias `@` resolves to the project root (where `vite.config.ts` lives), not `src/`.
