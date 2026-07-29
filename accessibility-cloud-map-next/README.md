# Accessibility Map — powered by accessibility.cloud

A **Next.js** prototype iteration of the ComfeeAI accessibility map, built
entirely on [**Accessibility Cloud**](https://github.com/sozialhelden/accessibility-cloud)
— an open, free accessibility-data API run by
[Sozialhelden e.V.](https://www.sozialhelden.de) (the non-profit behind
Wheelmap.org). Built as a separate iteration to evaluate this data source
against the custom `comfee-map-server` backend used in the previous version.

## Why this is a separate repo

This is intentionally **not** connected to `comfee-map-server` or its
Supabase database — it's a standalone prototype so it can be reviewed and
compared independently, per the brief.

## What's different from the previous iteration

| | Previous iteration (`comfee-map-server`) | This iteration (accessibility.cloud) |
|---|---|---|
| Backend | Custom Express + Supabase, self-hosted | None needed — public API, called directly from the browser |
| Place data | Custom-seeded, London-focused | Global, aggregated from many real-world data sources (172+ categories) |
| Wheelchair filtering | Manual accessibility fields | Built-in filter presets (`fully-accessible-by-wheelchair`, etc.) |
| Elevator/escalator outages | TfL (London Underground only) | `/disruptions` — any city with data coverage |
| Photos | Not implemented | Built-in `/images` endpoint per place |
| **Routing / turn-by-turn navigation** | ✅ Full custom routing engine | ❌ **Not available** — accessibility.cloud has no routing API at all |
| Auth / user accounts | Custom Supabase auth | Not needed for this prototype (read-only API usage) |

**The big trade-off for the review:** this iteration is significantly richer
on *place and accessibility data*, but has **zero navigation** built into the
data source itself. See "Wheelchair-user features" below for how this
iteration bridges that gap pragmatically (distance + external directions
handoff) rather than pretending to have routing it doesn't.

## Features implemented

### Core map (from accessibility.cloud)
- MapLibre GL map (free CARTO basemap, no map API key needed)
- Wheelchair-accessibility filter presets, applied server-side via the
  API's `filter` parameter
- Category filtering (172+ categories, fetched live from `/categories`)
- Color-coded place markers by accessibility status
- Live elevator/escalator disruption layer (`/disruptions`)
- Elevator/escalator location layer (`/equipment-infos`)
- Place detail panel: name, category, address, phone, website, and
  community-submitted photos (`/images`)
- Global stats bar (`/global-stats`)
- Tile-based (`x/y/z`) place fetching — accessibility.cloud's own
  recommended pattern for map libraries (cacheable, bounded responses)

### Wheelchair-user-focused additions (beyond the raw API)
- **Quick-access shortcuts** — one-tap jumps to accessible toilets,
  parking, pharmacies, restaurants near you, instead of digging through a
  general category list every time
- **Live distance + walking-time estimates** from your current location to
  every place, at a wheelchair-appropriate pace estimate
- **"Get walking directions" handoff** to Google/Apple Maps — since
  accessibility.cloud has no routing API at all, this is an honest bridge:
  real turn-by-turn directions via an external app, rather than pretending
  this prototype has its own routing
- **Disruption warnings surfaced directly on place details** — if a nearby
  elevator/escalator has an active outage, you see it before you travel
  there, not just as a separate map layer you might miss
- **A sortable list view alongside the map** — tapping small map pins is
  hard for many users (motor or vision-related); a list of nearby places
  with large touch targets, sorted by distance, is a real accessibility
  improvement to the app itself
- **Saved/favorite places** (stored locally) — quick access to places you
  visit often (home, work, a regular clinic)
- **An accessible UI, not just an accessible-places map** — keyboard
  navigation, screen-reader labels, a skip-to-map link, and a settings
  panel for adjustable text size, high-contrast mode, and reduced motion

## Getting started

```bash
npm install
npm run dev
```

Opens at `http://localhost:3000`.

### API token

Uses `NEXT_PUBLIC_AC_APP_TOKEN` (see `.env.local`). It currently defaults to
**Sozialhelden's own public demo token** (from their official example widget
repo) — good enough for evaluating this prototype, but get your own free
token before relying on this beyond initial testing:

1. Sign up at <https://accessibility.cloud>
2. Create an organization
3. Add an "app" under it — this generates a free API token
4. Put it in `.env.local`:
   ```
   NEXT_PUBLIC_AC_APP_TOKEN=your-token-here
   ```
5. Restart `npm run dev` (env changes need a real restart, not just a save)

## Deployment

Standard Next.js app — no custom backend, no database.

- **Vercel** (simplest): connect the repo, it auto-detects Next.js. Set
  `NEXT_PUBLIC_AC_APP_TOKEN` as an environment variable in project settings.
- **Self-host**: `npm run build && npm run start` (or behind a process
  manager / reverse proxy of your choice).

## Project structure

```
src/
  app/
    layout.tsx, page.tsx, globals.css
  components/
    MapAppLoader.tsx    Client-only loader (hydration-safe mount gate)
    MapApp.tsx           Main app shell wiring everything together
    MapView.tsx           MapLibre map + all data layers + user location marker
    SearchBar, FilterPanel, QuickFilters, PlacesList, DetailPanel,
    AccessibilityToolbar, Legend, StatsBar
  hooks/
    useAccessibilityData   Viewport-driven data fetching with tile caching
    useUserLocation         Live geolocation tracking
    useFavorites            localStorage-backed saved places
    useA11ySettings         App's own accessibility settings (text size, contrast)
    useCategories           Shared category list fetch
  lib/
    accessibilityCloud.ts   API client (place-infos, disruptions, equipment-infos, categories, global-stats, images)
    tileMath.ts             Slippy-map tile math for x/y/z place queries
    geocoding.ts            Free Photon geocoding for the search bar
    distance.ts             Distance calc + external directions link builder
  types/
    accessibilityCloud.ts   TypeScript types matching the API's GeoJSON schema
```

## Known limitations / things to note for the review

- Data coverage varies significantly by city/region — depends entirely on
  which organizations have imported data for that area. Berlin/Vienna
  (Sozialhelden's home base) tend to have strong coverage; others may be
  sparse.
- No native routing — see the "Get directions" external handoff above as
  the pragmatic bridge for this gap.
- The demo app token is shared/rate-limited — generate a dedicated token
  before wider testing.
- Radius-based queries (`/disruptions`, `/equipment-infos`) are capped at
  10,000m by the API itself.
- Default map center is Berlin (`13.405, 52.52`) since that's where data
  coverage is strongest; change the default in `MapView.tsx` if the review
  should focus on a different city (e.g. London, to compare fairly against
  the previous iteration — though London's coverage on this API may be
  thinner).
