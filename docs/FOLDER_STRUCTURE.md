# Folder Structure

```
disney-command-pwa/
├── public/
│   ├── icons/                     # PWA manifest icons (192, 512, 512 maskable)
│   └── offline.html               # Static fallback for the no-cache-at-all edge case
├── src/
│   ├── main.tsx                   # Entry point — mounts <App/>
│   ├── App.tsx                    # Composition root: providers + router
│   ├── vite-env.d.ts              # Vite/env type augmentation
│   │
│   ├── app/                       # App-level wiring (not a "feature")
│   │   ├── routes.tsx             # React Router config
│   │   ├── providers/             # RepositoryProvider, QueryProvider, ThemeProvider, AppErrorBoundary, theme.store
│   │   └── layout/                # AppShell, NavBar, ThemeToggle
│   │
│   ├── domain/                    # Pure business types + rules — zero I/O, zero React
│   │   ├── entities/              # zod schemas + inferred types (Attraction, Command, Family, Trip, Achievement, Weather)
│   │   ├── constants/             # Static lookup data (park names, coordinates)
│   │   └── rules/                 # Pure derived-value functions (familyRules, tripRules)
│   │
│   ├── application/                # Use-case layer
│   │   ├── repositories/          # Repository INTERFACES only
│   │   └── engines/                # commandEngine, decisionEngine, scoring — pure functions + tests
│   │
│   ├── infrastructure/            # Concrete implementations of application interfaces
│   │   ├── local/                 # Dexie schema, seed loader, seed JSON, Local*Repository classes
│   │   ├── weather/                # OpenMeteoWeatherRepository
│   │   └── container.ts            # DI container — the one backend swap point
│   │
│   ├── features/
│   │   └── dashboard/              # The Phase 1 screen
│   │       ├── DashboardPage.tsx
│   │       ├── components/         # Dashboard-only UI components
│   │       ├── hooks/               # useCommandQueue, useContingencies, useWeather, useClock, useCompleteCommand, ...
│   │       └── dashboard.store.ts  # Zustand — UI-only state for this feature
│   │
│   ├── shared/                     # Cross-feature building blocks
│   │   ├── components/ui/          # shadcn/ui primitives (Button, Card, Sheet, ...)
│   │   ├── components/             # ErrorBoundary, OfflineIndicator
│   │   ├── hooks/                   # useRepositories, useOnlineStatus, useMediaQuery, useTicker
│   │   └── lib/                     # cn, formatTime, queryKeys, notifications
│   │
│   ├── styles/globals.css          # Tailwind entry + CSS custom properties (palette, light/dark)
│   └── test/                       # Vitest setup + shared test DB helper
│
├── docs/                           # This document and its siblings
├── components.json                 # shadcn/ui config
├── vite.config.ts                  # Vite + Tailwind + PWA + Vitest config
└── eslint.config.js
```

## Naming and placement conventions

- A file lives under `features/<feature>/` only if it is not reused outside that feature. The
  moment a second feature needs it, it moves to `shared/`.
- Zod schema files in `domain/entities/` always export both the schema (`FooSchema`) and the
  inferred type (`type Foo = z.infer<typeof FooSchema>`) from the same file, so they can never
  drift apart.
- Repository implementations are named `Local<Entity>Repository` or `<Provider><Entity>Repository`
  (e.g. `OpenMeteoWeatherRepository`) and live under `infrastructure/`, never under `application/`.
