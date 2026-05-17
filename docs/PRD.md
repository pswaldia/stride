# Stride — Product Requirements Document
**Version:** 1.1 · **Status:** Approved · **Last updated:** May 2025

---

## 1. Executive summary

Stride is a personal marathon training web application that aggregates run data
from Strava via webhook, enriches it with weather context from Open-Meteo, and
surfaces intelligent coaching insights powered by the Anthropic Claude API.

Strava's most valuable analytics — heatmaps, route hotspots, training load
modelling, pace analysis — are locked behind a paid subscription. Stride
replicates and extends these features using the user's own data, with no
recurring cost and full data ownership.

---

## 2. Problem statement

| Problem | Detail |
|---|---|
| Paywalled analytics | Strava charges monthly for heatmaps, route exploration, segment analysis |
| No unified training view | Strava presents individual runs well but lacks longitudinal analysis |
| No AI coaching layer | No tool connects: high HR + heat + sleep = fatigue risk, not fitness loss |
| Fragmented data | Weather, HR trends, and pace adjustments live in separate places |

---

## 3. Goals and non-goals

### Goals
- Replace Strava's paid heatmap and hotspot features with a self-hosted equivalent
- Provide a training calendar with per-day run detail
- Implement the ATL/CTL/TSB training load model (same as TrainingPeaks)
- Surface AI-powered coaching insights reactively via Claude API
- Ship as production-grade: CI/CD, Vercel, schema migrations version-controlled
- Support dark and light mode with a mobile-responsive layout

### Non-goals (v1.0)
- Apple Health / Apple Watch integration → v2
- Natural language querying → v2
- Multi-user support → v2
- Proactive notifications or push alerts → v2
- Social or sharing features → v2
- Smart weekly plan generator → v2
- Shoe mileage tracking → v2

---

## 4. Target user

Single user: a software engineer training for a marathon who uses Strava and an
Apple Watch to track runs. Technically proficient, comfortable with self-hosted
tooling, wants a polished product-quality interface.

| Attribute | Detail |
|---|---|
| Technical level | Software engineer |
| Primary device | Desktop for analysis; mobile for quick post-run checks |
| Data sources | Strava (primary). Open-Meteo for weather enrichment (automatic) |
| Usage pattern | Reactive — opens app to review runs, check load, or query AI coach |
| Goal | Finish a marathon. Stop paying Strava's monthly fee. |

---

## 5. Feature specification

### 5.1 Dashboard — home screen

#### 5.1.1 Summary stats bar
- Four metric cards: weekly distance (km), avg pace (/km), avg HR (bpm), elevation (m)
- Trend indicator vs previous period — green for improvement, red for regression
- Badges use semantic colour coding

#### 5.1.2 Training calendar
- Month-view. Each run day shows a colour-coded dot:
  - Green `#2E7D32` = easy · Amber `#B45309` = tempo · Ember `#C0392B` = long · Purple `#7C3AED` = race
- Click a day → run detail panel opens in right sidebar
- Month navigation with prev/next. Today highlighted with accent border.

#### 5.1.3 Weekly mileage chart
- Bar chart, last 8 weeks. Current week = accent colour. Others = neutral.
- Proportionally sized bars

#### 5.1.4 Training load mini-panel
- CTL (blue), ATL (amber), TSB (green) as horizontal bars
- Plain-English status badge: Good form / Fatigued / Freshening up / Peak

#### 5.1.5 AI insight card
- Most recent AI coaching insight
- Link to full AI insights panel

### 5.2 Run detail panel
- Mini route map (Mapbox GL JS polyline)
- Stats grid: distance, duration, pace, avg HR, max HR, elevation
- Weather snapshot: temperature, humidity, conditions
- Lap splits table (if available from Strava)
- Run type badge (Easy / Tempo / Long / Race)

### 5.3 Global map and hotspot screen

#### 5.3.1 Heatmap layer
- All GPS polylines decoded into coordinate arrays, rendered as Mapbox heatmap
- Intensity ∝ frequency — more-run routes appear brighter
- Colour ramp: low-opacity accent at low density → full opacity at high density

#### 5.3.2 Filter controls
- Run type filter: All / Easy / Tempo / Long
- Time range filter: All time / 3 months / This month
- Both filters client-side — no re-fetch

#### 5.3.3 City-level breakdown
- Cities ranked by total km. Each row: name, country, run count, proportional bar, total km
- City determined by reverse-geocoding run centroid via Mapbox

#### 5.3.4 Hotspot pins
- Top 5 locations by run frequency, annotated with named pins
- Pin size encodes rank
- Tooltip on hover: name + run count

#### 5.3.5 Map stats panel
- Total distance, total runs, unique routes, cities explored, total elevation

### 5.4 Training load screen
- Line chart: CTL, ATL, TSB over time
- TSB zero line marked — positive = fresh, negative = fatigue
- Vertical markers: race days, rest weeks
- TSS estimated from HR zones when threshold unknown
- Threshold HR/pace optionally set in settings

### 5.5 AI insights panel
All features are reactive — user triggers, no proactive push in v1.

#### 5.5.1 Training load analysis
- 4-week or 8-week analysis via Claude
- Ramp rate evaluation (flags > 8 CTL points/week)
- Plain-English CTL/ATL/TSB interpretation

#### 5.5.2 Race predictor
- Weighted Riegel formula: recent runs weighted 2×, older 1×
- Elevation-corrected pace (+6s/km per 100m gain)
- Output: confidence interval ("4:05–4:20, trending faster")
- Claude narrative on projection and remaining training priorities

#### 5.5.3 Anomaly detection
- Z-score of HR vs pace vs 90-day rolling baseline
- Triggered when deviation > 1.5 standard deviations
- Claude explanation using weather + load + ATL context
- Output categories: heat-related / fatigue-related / unexplained / normal

#### 5.5.4 Weather correlation analysis
- Linear regression: pace ~ temperature, pace ~ humidity
- Claude interprets coefficients in plain English
- Weather-adjusted pace per run

---

## 6. Data architecture

### Database schema
See `docs/SCHEMA.md` for full reference.

### Strava integration
- Webhook Events API — push on run completion, < 5s latency
- Endpoint: `POST /api/webhooks/strava`
- On `create` event for `activity` type `Run`: fetch full activity → store → enrich
- Historical backfill: paginated Activities List API on first setup
- OAuth tokens stored encrypted in environment variables

### Weather enrichment
- Open-Meteo Historical Weather API — free, no key required
- Called once per run at ingestion. Stored in `weather` table.
- Fields: temperature (°C), humidity (%), wind (km/h), conditions string

---

## 7. Technical stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Database | Supabase (Postgres + PostGIS) |
| Maps | Mapbox GL JS via react-map-gl |
| Charts | Recharts |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| Styling | Tailwind CSS |
| Deployment | Vercel |
| CI/CD | GitHub Actions + Vercel auto-deploy |
| Migrations | Supabase CLI |
| Auth | Supabase Auth (magic link) |

---

## 8. External APIs

| Service | Purpose | Cost | Auth |
|---|---|---|---|
| Strava API | Run ingestion via webhook + backfill | Free | OAuth 2.0 |
| Mapbox GL JS | Map, heatmap, geocoding | Free (50k/mo) | Public token |
| Open-Meteo | Historical weather per run | Free, no key | None |
| Anthropic API | AI coaching insights | Pay per use | API key |

---

## 9. CI/CD and deployment

- **Trigger**: push to any branch, PR opened against `main`
- **Steps**: install → ESLint → TypeScript typecheck → Vitest unit tests
- **Deploy**: Vercel auto-deploys `main` to production; each PR gets preview URL
- **Migrations**: `supabase db push` runs automatically on deploy via GitHub Actions

### Environment variables
```
STRAVA_CLIENT_ID · STRAVA_CLIENT_SECRET · STRAVA_WEBHOOK_VERIFY_TOKEN
STRAVA_OWNER_ID · STRAVA_SUBSCRIPTION_ID
NEXT_PUBLIC_MAPBOX_TOKEN
ANTHROPIC_API_KEY
NEXT_PUBLIC_SUPABASE_URL · NEXT_PUBLIC_SUPABASE_ANON_KEY · SUPABASE_SERVICE_ROLE_KEY
```

---

## 10. Design system
See `docs/DESIGN.md` for full Chalk & Ember token reference.

- Dark-first with full light mode. System preference respected on first load.
- Mobile-responsive: sidebar → bottom tab bar on screens < 640px.
- Fonts: Outfit (headings, data) + Plus Jakarta Sans (body)

---

## 11. Success metrics

| Metric | Target |
|---|---|
| Webhook → DB latency | < 5 seconds |
| Map load (200+ runs) | < 3 seconds first render |
| AI insight response | < 8 seconds |
| Uptime | > 99.5% monthly |
| Mobile usability | All core features on 390px viewport |
| Historical backfill | Full history imported < 5 minutes |

---

## 12. Milestones

| Milestone | Scope | Est. effort |
|---|---|---|
| M1 — Foundation | Repo scaffold, Supabase schema, Strava webhook, weather enrichment, backfill, CI/CD | 1 week |
| M2 — Dashboard | Design system, calendar, stats, run detail panel, weekly chart | 1.5 weeks |
| M3 — Map & hotspots | Heatmap, filters, city breakdown, hotspot pins | 1 week |
| M4 — Training load | TSS computation, CTL/ATL/TSB, load screen, settings | 1 week |
| M5 — AI coaching | Claude integration, all 4 AI features, insights panel | 1.5 weeks |
| M6 — Polish | Error handling, loading states, mobile, performance, security | 1 week |

---

## 13. Open questions

| Question | Decision needed by |
|---|---|
| Strava developer app created (Client ID + Secret)? | Before M1 |
| Historical backfill: all runs or start fresh? | Before M1 deploy |
| Auth: Supabase magic link or simpler? | M1 |
| Threshold HR/pace: prompt user or always estimate? | M4 |
| Race date: settings UI or env var? | M4 |

---

## Appendix A — Training load model
- **CTL** = 42-day EWMA of daily TSS (fitness)
- **ATL** = 7-day EWMA of daily TSS (fatigue)
- **TSB** = CTL − ATL (form — positive = fresh, negative = fatigued)
- TSS estimated from HR zones when power unavailable

## Appendix B — Race prediction
- Riegel: `T2 = T1 × (D2 / D1) ^ 1.06`
- Recency weighting: last 4 weeks = 2×, last 8 weeks = 1×
- Elevation correction: +6s/km per 100m gain

## Appendix C — Run type classification
- `race` — Strava `workout_type === 1`
- `long` — distance ≥ 16km AND avg_hr < threshold × 0.85
- `tempo` — avg_hr > threshold × 0.88 OR avg_pace < threshold_pace × 0.95
- `easy` — all other runs
