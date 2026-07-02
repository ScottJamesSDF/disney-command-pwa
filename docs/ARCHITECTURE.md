# Architecture

Disney Command is built as a Clean Architecture / feature-based React PWA. This document
explains the layering, the dependency rule, how SOLID principles map onto the codebase, and the
rationale behind the local-first backend strategy.

## Layers

```
domain          ← pure types, zod schemas, business rules (no I/O, no React, no UI)
application     ← repository interfaces + the Command/Decision engines (pure functions)
infrastructure  ← concrete repository implementations (Dexie, Open-Meteo), the DI container
features        ← one folder per screen; React components/hooks/state for that feature
app             ← routing, providers, layout chrome — the composition root
shared          ← cross-feature UI primitives, hooks, and utilities
```

### Dependency rule

Dependencies only point inward:

```
features  →  application  →  domain
infrastructure  →  application (interfaces only)  →  domain
```

`domain` never imports from any other layer. `application` only imports `domain` types and
defines *interfaces* for repositories — it never imports a concrete repository implementation.
`infrastructure` implements those interfaces. `features` consume repositories exclusively through
`useRepositories()` (`shared/hooks/useRepositories.ts`); no feature file imports a
`Local*Repository` or `OpenMeteoWeatherRepository` class directly. The only two files allowed to
reference concrete repository classes are `infrastructure/container.ts` (constructs them) and
`app/providers/RepositoryProvider.tsx` (calls `createContainer()` once and exposes the result via
React context).

## SOLID mapping

- **Single Responsibility** — the Command Engine's priority waterfall is split into one function
  per condition (`checkLightningLaneWindow`, `checkImminentDining`, ...), each independently
  testable. The Decision Engine mirrors this for contingencies.
- **Open/Closed** — new command types or contingency checks can be added as new functions
  appended to the waterfall/contingency list without modifying existing checks.
- **Liskov Substitution** — any `TripRepository` implementation (local or, later, Supabase) is
  interchangeable everywhere the interface is consumed; the engines and hooks never know which
  one they're talking to.
- **Interface Segregation** — five small, entity-scoped repository interfaces
  (`application/repositories/*.ts`) instead of one large repository "god object".
- **Dependency Inversion** — `infrastructure/container.ts` is the single place concrete
  implementations are wired to interfaces (see below). Everything else depends on the interfaces.

## Why local-first now, Supabase later

Phase 1 ships with **zero required backend setup** — the app seeds itself from bundled JSON
fixtures into IndexedDB (via Dexie) on first load and is fully functional offline. This was a
deliberate choice so the app has zero required configuration and can be evaluated/demoed
immediately.

The repository-interface + DI-container pattern means this was not a shortcut that creates
rework later: `infrastructure/container.ts`'s `createContainer()` is the *only* place that
decides which concrete class backs each interface. Adding Supabase support in a later phase is:

1. Add `infrastructure/supabase/Supabase*Repository.ts` files implementing the same five
   interfaces, against the schema in [DATA_MODEL.md](./DATA_MODEL.md) (designed now, even though
   unimplemented, per the "don't skip architecture" principle).
2. Add a `backend === 'supabase'` branch in `createContainer()`.

No feature, hook, or component changes are required.

## PWA scoping — what's real vs. deferred

- **Offline support** is not a special case — since Dexie is the primary read path regardless of
  connectivity, the Dashboard shows last-known data offline automatically. `vite-plugin-pwa`
  (Workbox `generateSW` strategy) precaches the app shell and falls back to it on navigation.
- **Background sync** in Phase 1 covers the Open-Meteo weather fetch (a `BackgroundSyncPlugin`
  retries it once connectivity returns). There is no outbound *mutation* queue yet because Dexie
  writes are already durable and instantaneous offline — a mutation-queue for outbound Supabase
  writes is a Phase 2+ item once there's a remote backend to sync to.
- **Push notifications** in Phase 1 are real, client-triggered local notifications (Notification
  API), firing when the Command Engine's derived state crosses a threshold (Lightning Lane window
  opening, dining imminent, hydration due). There is no backend in Phase 1 to push *from*, so true
  server-initiated Web Push (VAPID + Supabase Edge Functions) is explicitly a Phase 2+ item —
  implementing a fake subscription now would be exactly the kind of placeholder code this project
  avoids.

## The Command Engine and Decision Engine are pure functions

`application/engines/commandEngine.ts` and `decisionEngine.ts` take all their inputs as
parameters (including `currentTime`) and return plain data — no I/O, no framework dependency, no
hidden system-clock reads. This is what makes them fully unit-testable (see
[TESTING_STRATEGY.md](./TESTING_STRATEGY.md)) and is also what "Planner outputs JSON, UI consumes
JSON" means in practice: the engines are the planner, and their output (`CommandQueue`,
`Contingency[]`) is plain JSON-serializable data that any UI could render.

## Roadmap

See the root [README.md](../README.md) for the Phase 2+ feature roadmap.
