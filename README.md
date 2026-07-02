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

**Since Phase 1**: a manual Trip/Family editor (`src/features/planner/`, reachable via the
"Planner" nav entry) now lets you create/edit your own trip and family, so the Dashboard reads
real user-entered data instead of only the fixed demo trip/family.

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

1. ~~**Trip/Family data model editor**~~ — **done.** Manual Trip + Family editor
   (`src/features/planner/`) lets users create/edit their own trip and family so every other
   feature below has real data to work with instead of the fixed demo trip/family.
2. ~~**AI itinerary generation (heuristic, single-day)**~~ — **done.** A rule-based, fully-offline
   auto-planner (`src/application/planner/generateItinerary.ts`) ranks and selects attractions by
   reusing the existing desirability scorer, exposed as an "Auto-Plan Day" button in the manual
   editor that fills in `plannedAttractions` for a single already-configured park day, which the
   user can still hand-edit before saving. **Still open:** an LLM/conversational version, and
   multi-day/whole-trip generation (deciding which park to visit which day) — both out of scope
   for this pass.
3. **Lightning Lane Assistant** — booking flow that sets `lightningLaneReturnTime` on live attractions.
4. **Dining** — CRUD for reservations, feeding the dining-imminent waterfall step.
5. **Family management enhancements** — richer member management beyond the base editor (e.g.
   in-the-moment energy/hydration overrides surfaced directly on the Dashboard).
6. **Timeline** — historical/planned view of the day.
7. **Maps** — canvas visualization over the already-modeled `mapX`/`mapY` attraction coordinates.
8. **Galaxy's Edge** — special-interest content layer.
9. **Achievements** — needs real completion events from 2–5 to have meaningful triggers.
10. **Statistics** — aggregates across the above.
11. **Checklists** — packing/prep lists.
12. **Supabase backend swap** — implement `Supabase*Repository` classes against
    [docs/DATA_MODEL.md](./docs/DATA_MODEL.md); a `container.ts`-only change per the architecture
    guarantee established in Phase 1.
13. **True server Web Push** (VAPID + Supabase Edge Functions) — needs Supabase to send from.
14. **Mutation-queue background sync** for offline Supabase writes.
