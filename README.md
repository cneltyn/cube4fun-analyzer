# Cube4fun Competition Analyzer

Analyze WCA competitions from [cube4fun.pl](https://cube4fun.pl): registered competitors, events, and WCA personal bests.

## API Endpoints

### cube4fun.pl

| Endpoint | Purpose |
|----------|---------|
| `GET /api/events/get/by-code/{code}?with_long_texts=1` | Event info |
| `GET /api/events/get-players/{event_id}` | Confirmed / reserve / unconfirmed competitors |

### WCA

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v0/persons/{wca_id}/personal_records` | Personal bests |
| `GET /api/v0/persons/{wca_id}/results` | Competition history (recent form) |

Fetched in parallel (5 concurrent) and cached in `localStorage` (7-day TTL).

## Analysis columns

| Column | Meaning |
|--------|---------|
| PB / PB avg | WCA personal bests |
| Recent (5) | Mean average over last 5 competitions |
| Trend | Newer vs older half of those comps (↑ = improving) |
| vs PB | Recent avg − PB avg (negative = on form) |

Default sort: **Recent (5)**. Use **Improving only** filter to spot who's getting faster.

## Deploy to Vercel

The app is configured for Vercel with API rewrites (avoids CORS in production).

```bash
npm i -g vercel   # if needed
vercel login
vercel            # preview deployment
vercel --prod     # production
```

Or connect the GitHub repo in the [Vercel dashboard](https://vercel.com/new) — it auto-detects Vite.

## Usage

1. Enter event code → **Load event**
2. Select an event badge (e.g. 3×3×3)
3. **Load WCA data** — PBs + last 5 comp results per person
4. Sort by Recent / Trend / vs PB; toggle **Improving only**
5. **Refresh all** after recent competitions to update form

## Project structure

```
src/
  api/          cube4fun + WCA fetchers
  cache/        localStorage WCA cache
  components/   UI components
  hooks/        useCompetitionAnalyzer
  lib/          player filtering/sorting, time formatting
```
