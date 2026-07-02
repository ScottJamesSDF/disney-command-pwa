# Disney Command

An AI-powered Disney vacation operations center. It doesn't just show you information — it
continually answers **"What should we do next?"**, minimizing walking, waiting, and decision
fatigue while maximizing attractions completed, rest, and family enjoyment.

This is the React/TypeScript PWA implementation. (A separate Flutter prototype of the same
product concept exists elsewhere in this workspace — this project is a from-scratch rebuild on a
different stack, not a port of that code.)

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · shadcn/ui (Radix primitives) · React Router ·
TanStack Query · Zustand · Framer Motion · Dexie (IndexedDB) · Zod · Vitest

Backend: **local-first** in Phase 1 (no account/setup required) — see
[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for why, and how a Supabase backend swaps in later
with zero feature-code changes.

## Quick start

```bash
npm install
npm run dev
```

Open the printed local URL. The app seeds itself with a demo trip (The Johnson Family at Magic
Kingdom) on first load — no configuration, no accounts, no API keys.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) then production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (write) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest (watch mode) |
| `npm run test:ui` | Vitest with the browser UI |
| `npm run test:coverage` | Vitest with coverage (engines gated at 90% branch coverage) |

## What's in Phase 1

One fully-functional screen, end to end: the **Dashboard** — the "what should we do next" mission
control view. Real Command Engine logic (ported from a reference implementation's business
rules), real IndexedDB persistence, real weather (Open-Meteo, no API key), installable PWA with
offline support, dark mode, and a real local-notification system.

Everything else (Timeline, Maps, Galaxy's Edge, the AI Trip Planner, Lightning Lane booking,
Dining, Family management, Achievements, Statistics, Checklists) is **out of scope for Phase 1 on
purpose** — the project ships one real, fully-working feature at a time rather than many
half-built screens. See the roadmap below for build order.

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) — layering, dependency rule, SOLID mapping, local-first rationale
- [Folder Structure](./docs/FOLDER_STRUCTURE.md)
- [Data Model](./docs/DATA_MODEL.md) — current Dexie schema + the designed-ahead future Supabase/Postgres schema
- [State Management](./docs/STATE_MANAGEMENT.md) — TanStack Query vs. Zustand boundary
- [Testing Strategy](./docs/TESTING_STRATEGY.md)
- [CI/CD](./docs/CI_CD.md)
- [Deployment](./docs/DEPLOYMENT.md) — Vercel, free tier
- [Components](./docs/COMPONENTS.md)

## Roadmap (Phase 2+)

1. **Trip Planner / AI itinerary generator** — produces the `Trip`/`ParkDay` JSON the Dashboard
   already knows how to consume; the most load-bearing next step, since Phase 1 only ships a
   fixed demo trip.
2. **Lightning Lane Assistant** — booking flow that sets `lightningLaneReturnTime` on live attractions.
3. **Dining** — CRUD for reservations, feeding the dining-imminent waterfall step.
4. **Family management** — CRUD for members, manual energy/hydration overrides.
5. **Timeline** — historical/planned view of the day.
6. **Maps** — canvas visualization over the already-modeled `mapX`/`mapY` attraction coordinates.
7. **Galaxy's Edge** — special-interest content layer.
8. **Achievements** — needs real completion events from 1–4 to have meaningful triggers.
9. **Statistics** — aggregates across the above.
10. **Checklists** — packing/prep lists.
11. **Supabase backend swap** — implement `Supabase*Repository` classes against
    [docs/DATA_MODEL.md](./docs/DATA_MODEL.md); a `container.ts`-only change per the architecture
    guarantee established in Phase 1.
12. **True server Web Push** (VAPID + Supabase Edge Functions) — needs Supabase to send from.
13. **Mutation-queue background sync** for offline Supabase writes.
