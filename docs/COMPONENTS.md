# Component Documentation

Phase 1 has one screen's worth of components — a full Storybook install would be scaffolding
ahead of need. Instead, every component's props interface carries a one-line JSDoc comment where
its purpose isn't obvious from the name/props alone, and this document is the index. Revisit
Storybook once component count grows meaningfully in Phase 2+ (Planner, Maps, and Galaxy's Edge
will each bring several new reusable pieces).

## `shared/components/ui/*`
Hand-authored shadcn/ui ("new-york" style) primitives: `Button`, `Card`, `Badge`, `Skeleton`,
`Progress`, `Separator`, `Sheet`, `Tooltip`, `Alert`, `Switch`, `Avatar`. Standard shadcn API —
see [ui.shadcn.com](https://ui.shadcn.com) for usage if unfamiliar. `components.json` points the
`ui` alias at `@/shared/components/ui`.

## `app/layout/*`

| Component | Responsibility |
|---|---|
| `AppShell` | Page chrome: sticky top bar (`NavBar` + `OfflineIndicator`) + `<Outlet/>` |
| `NavBar` | Section navigation; only "Dashboard" is a live route in Phase 1, the rest render as disabled entries with a "Coming soon" tooltip |
| `ThemeToggle` | Sun/moon icon button toggling `theme.store`'s `isDarkMode` |

## `features/dashboard/components/*`

| Component | Responsibility |
|---|---|
| `CommandHeader` | Wordmark, live `HH:MM:SS` clock, pulsing status dot, theme toggle |
| `DayProgressBar` | Completed/total attraction count + progress bar for today's `ParkDay` |
| `ContingencyBanner` | Shows the highest-priority contingency (if any) as an alert with a "View alternatives" Sheet |
| `CommandCard` | The hero card for `queue.current` — headline, walk/wait/duration metrics, Lightning Lane badge, Complete/Skip actions |
| `LightningLaneCountdown` | Small `mm:ss` badge counting down to (or announcing) an attraction's Lightning Lane window |
| `WeatherWidget` | Current temperature/condition from Open-Meteo, with a "Cached" badge when serving a stale fallback |
| `FamilyStatusBar` | Group + per-member energy level, with a hydration-due indicator |
| `UpcomingQueue` | The next few commands in `queue.upcoming`, staggered fade-in |
| `DashboardSkeleton` | Loading placeholder matching the resolved layout's shape |
| `DashboardErrorFallback` | Retry card shown on query error or when no active trip exists |

## `features/dashboard/hooks/*`

| Hook | Responsibility |
|---|---|
| `useCommandQueue` | Combines trip/family/attractions queries, derives `CommandQueue` via the Command Engine |
| `useContingencies` | Derives `Contingency[]` via the Decision Engine |
| `useWeather` | Fetches/caches weather for Magic Kingdom's coordinates (15-minute refetch interval) |
| `useClock` | Display-only clock, ticks every second, never triggers engine recomputation |
| `useCompleteCommand` | Mutation for marking an attraction complete/skipped, with optimistic visual feedback |
| `useDashboardNotifications` | Fires a local Notification when the current command becomes urgent, deduped per underlying situation |
