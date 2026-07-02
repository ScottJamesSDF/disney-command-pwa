# CI/CD

**Status: documented, not yet wired.** Per the project's phased approach, Phase 1 focuses on a
single fully-functional screen with solid local tests; committing the actual GitHub Actions
workflow file is a Phase 2+ task. This document specifies exactly what that workflow should do so
it can be added without further design work.

## Planned pipeline (`.github/workflows/ci.yml`)

Triggers: every pull request against `main`, and every push to `main`.

```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:coverage
      - run: npm run build
```

Steps run in this order deliberately — cheapest/fastest checks first (lint, typecheck) so a
trivial mistake fails in seconds rather than waiting for the full test suite and a production
build.

## Coverage gate

`npm run test:coverage` already enforces the 90% branch-coverage threshold on
`src/application/engines/**` via `vite.config.ts` (see [TESTING_STRATEGY.md](./TESTING_STRATEGY.md))
— a failing threshold fails the `npm run test:coverage` step and therefore the whole workflow, no
separate coverage-reporting action is required for Phase 1.

## Deployment trigger

Once [DEPLOYMENT.md](./DEPLOYMENT.md)'s Vercel project is connected to this GitHub repo, Vercel's
own GitHub integration handles deploys directly (preview deployments per PR, production deploy on
merge to `main`) — no separate deploy step needs to be added to `ci.yml`. The CI workflow above
exists to gate merges on quality, not to perform the deployment itself.
