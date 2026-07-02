# State Management

Disney Command draws a hard boundary between two kinds of state, using two different tools on
purpose rather than reaching for one library to do everything.

## The rule

> If a piece of state originates from, or is written back to, a repository — it lives in
> **TanStack Query**. If it's purely about how the UI is currently presenting itself, it lives in
> **Zustand**.

The Command Engine and Decision Engine never touch either directly — they're pure functions
invoked from inside a `useMemo` that's keyed on query-derived data plus the current time.

## TanStack Query — repository-backed data

All async data flows through `useQuery`/`useMutation`, keyed via
[`shared/lib/queryKeys.ts`](../src/shared/lib/queryKeys.ts):

| Key | Hook | Source |
|---|---|---|
| `trip.active()` | `useCommandQueue` | `TripRepository.getActiveTrip()` |
| `family.active()` | `useCommandQueue` | `FamilyRepository.getActiveFamily()` |
| `attractions.live(park)` | `useCommandQueue`, `useContingencies` | `AttractionRepository.getLiveAttractions()` |
| `weather.current(lat, lng)` | `useWeather` | `WeatherRepository.getCurrentWeather()` |

`useCommandQueue` combines the trip/family/attractions queries and derives the `CommandQueue` via
`generateCommandQueue(...)` inside a `useMemo`. The `useMemo`'s time dependency is a **bucketed**
value from `useTicker(15_000)` — not `new Date()` on every render — so the engine only recomputes
every 15 seconds even though the on-screen clock (`useClock`, a separate `useTicker(1000)`) ticks
every second. This keeps the wall-clock display smooth without re-running the priority waterfall
60 times a minute.

`useContingencies` follows the same pattern against `detectContingencies(...)`.

Mutations (`useCompleteCommand`) call `TripRepository.markAttractionCompleted` /
`skipAttraction`, and invalidate `trip.active()` in `onSettled` so the next render reflects the
change. Optimistic visual feedback (an instant "Done!" state on the button before the mutation
resolves) is handled by `dashboard.store.ts`'s `optimisticCommandIds`, not by TanStack Query's
optimistic-cache-patch pattern — this was a deliberate simplification, since patching a deeply
nested `Trip.parkDays[].plannedAttractions[]` structure in the query cache added complexity out of
proportion to a single-user, single-active-trip Phase 1 app. Revisit if optimistic cache patching
becomes worthwhile once the Planner/Dining/Family screens add more mutation surface area.

## Zustand — UI-only state

- `app/providers/theme.store.ts` — `isDarkMode`, persisted to `localStorage` via zustand's
  `persist` middleware, defaulting to the OS `prefers-color-scheme` on first load.
- `features/dashboard/dashboard.store.ts` — `contingencySheetOpen` (is the alternatives Sheet
  open) and `optimisticCommandIds` (which command ids should render as instantly-resolved).

Neither store ever imports a repository or calls the engines — they are pure UI presentation
state.

## Why not put everything in Zustand (or everything in React Query)?

Putting repository data in Zustand would mean hand-rolling caching, staleness, refetch-on-focus,
and loading/error states that TanStack Query already provides. Putting UI-only state (like "is
this sheet open") in TanStack Query would mean inventing a fake query key for something that was
never fetched from anywhere — it doesn't have a server-of-record, so it doesn't belong in a
server-state cache.
