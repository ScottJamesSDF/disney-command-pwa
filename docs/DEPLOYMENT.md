# Deployment (Vercel)

Disney Command Phase 1 requires **zero environment variables** and **zero external accounts** to
run — it's entirely local-first (IndexedDB) and its only outbound network call (Open-Meteo
weather) needs no API key. This makes the Vercel setup unusually simple.

## One-time setup

1. Push this repository to GitHub.
2. In the [Vercel dashboard](https://vercel.com/new), import the repository.
3. Framework preset: **Vite** (auto-detected).
4. Build command: `npm run build` (auto-detected).
5. Output directory: `dist` (auto-detected).
6. Environment variables: **none required.** (Phase 2+, once the Supabase backend exists, add
   `VITE_DATA_BACKEND=supabase` plus the Supabase project URL/anon key here.)
7. Deploy.

Every subsequent push to `main` deploys to production; every pull request gets its own preview
deployment automatically — no extra configuration needed beyond the initial import.

## Custom domain (optional)

Vercel → Project → Settings → Domains → add the domain and follow the DNS instructions Vercel
provides (typically a `CNAME` to `cname.vercel-dns.com` or an `A` record to Vercel's IP).

## Staying within the free tier

- Vercel's Hobby tier free bandwidth/build-minutes allowance comfortably covers a project this
  size; the app ships no server-side rendering or Edge Functions in Phase 1, so it's served as a
  fully static SPA bundle plus the Workbox service worker — the cheapest possible Vercel workload.
- Open-Meteo's free tier (no API key, generous rate limits for non-commercial use) covers the
  weather widget with no billing risk.
- When the Supabase backend is added in Phase 2+, stay on Supabase's free tier (500MB Postgres,
  50k monthly active users, 5GB egress) — the local-first architecture means Supabase is
  read/write for sync, not a hard dependency for the app to function, which keeps usage light.

## Verifying the PWA after deploy

After the first production deploy, open the site on a phone or via Chrome DevTools → Application
tab and confirm:

- The manifest is valid (Application → Manifest — check icons, `theme_color`, `display: standalone`).
- The service worker registers (Application → Service Workers) and precaches the app shell.
- "Install app" appears in the browser's address bar / share sheet.
- Airplane mode + reload still renders the Dashboard with last-known data.
