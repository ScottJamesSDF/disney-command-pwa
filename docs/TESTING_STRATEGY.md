# Testing Strategy

## The pyramid, as implemented in Phase 1

**Required, and covered now:**

- **Engines** (`src/application/engines/__tests__/`) — pure-function tests with no I/O, using a
  fixed `currentTime` fixture (see `fixtures.ts`) so results are fully deterministic. Covers the
  entire Command Engine priority waterfall (including a multi-trigger precedence test), the
  scoring formula (individually and stacked), and all four implemented Decision Engine
  contingency checks plus their negative cases.
- **Repositories** (`src/infrastructure/local/repositories/__tests__/`,
  `src/infrastructure/weather/__tests__/`) — run against `fake-indexeddb` so Dexie works under
  Vitest/Node without a real browser. Covers first-run seeding, idempotent re-seeding, CRUD
  persistence, and the Open-Meteo repository's success/cache-fallback/no-cache-available paths
  (via a mocked `fetch`).

Run `npm run test:coverage`; the Vitest config enforces a **90% branch coverage** threshold
scoped to `src/application/engines/**` specifically (see `vite.config.ts`'s `test.coverage`
block) — that's the highest-risk, most business-logic-dense code in the app, so it's held to a
stricter bar than UI code.

### A note on test isolation with `fake-indexeddb`

`fake-indexeddb/auto` (loaded in `src/test/setup.ts`) keeps its in-memory store alive for the
whole test *process*, keyed by database name — it is **not** automatically reset between tests
or even between test files. Every repository test uses `src/test/dbTestUtils.ts`'s `freshDb()`,
which deletes the `disney-command` database before constructing a new `DisneyCommandDB()`, so
each test starts from a clean slate. Forgetting this is the single most common cause of
mysterious cross-test failures in this codebase — if a repository test fails with data that looks
like it came from a different test, check that `beforeEach` calls `freshDb()`.

**Optional / nice-to-have, not currently implemented:** React Testing Library smoke tests for a
couple of Dashboard components (e.g. `CommandCard` rendering without crashing for a `critical`
and a `normal` sample command, `DashboardPage` showing the skeleton while pending then the command
card once resolved). These were intentionally left out of Phase 1's required set so completion
wasn't blocked on broad component-test coverage for a single screen — add them opportunistically,
or as a first task if this branches into Phase 2 work on additional screens.

**Explicitly deferred to Phase 2+:**

- End-to-end tests (Playwright) — worth adding once there's more than one screen to click through.
- Visual regression testing.
- Actually wiring the CI pipeline described in [CI_CD.md](./CI_CD.md) (the workflow file is
  documented, not yet committed, per the "don't skip architecture, but also don't gold-plate a
  single-screen app" balance the user asked for).

## Vitest configuration notes

A single `environment: 'jsdom'` project is used for everything (engine tests included, even
though they don't need a DOM) rather than splitting into separate `node`/`jsdom` Vitest projects.
At this codebase's current size the extra jsdom setup cost per engine test file is negligible;
revisit only if engine test suite runtime becomes a measurable bottleneck.
