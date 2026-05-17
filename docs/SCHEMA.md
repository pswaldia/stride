# Stride — Database Schema Reference

Database: Supabase (Postgres 15 + PostGIS 3.x)

---

## Setup

```sql
-- Enable PostGIS (run once in Supabase SQL editor)
create extension if not exists postgis;
```

---

## Tables

### `runs`
Primary table. One row per Strava activity of type Run.

```sql
create table runs (
  id              uuid primary key default gen_random_uuid(),
  strava_id       bigint unique not null,
  date            date not null,
  started_at      timestamptz not null,
  distance_m      integer not null,        -- metres
  duration_s      integer not null,        -- seconds
  avg_hr          integer,                 -- bpm
  max_hr          integer,                 -- bpm
  avg_pace_s      integer,                 -- seconds per km
  elevation_m     integer default 0,       -- metres gain
  polyline        text,                    -- Strava encoded polyline
  route           geometry(LineString, 4326),  -- PostGIS decoded route
  centroid        geometry(Point, 4326),   -- ST_Centroid of route
  city            text,                    -- reverse geocoded
  country         text,
  run_type        text check (run_type in ('easy','tempo','long','race')),
  tss             numeric(6,2),            -- training stress score
  raw_json        jsonb,                   -- full Strava activity payload
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Indexes
create index runs_date_idx on runs(date desc);
create index runs_strava_id_idx on runs(strava_id);
create index runs_route_idx on runs using gist(route);
create index runs_centroid_idx on runs using gist(centroid);
create index runs_run_type_idx on runs(run_type);
```

### `laps`
Lap splits per run. Optional — only populated if Strava returns lap data.

```sql
create table laps (
  id          uuid primary key default gen_random_uuid(),
  run_id      uuid not null references runs(id) on delete cascade,
  lap_index   integer not null,
  distance_m  integer not null,
  elapsed_s   integer not null,
  avg_hr      integer,
  avg_pace_s  integer,                     -- seconds per km
  created_at  timestamptz default now(),
  unique(run_id, lap_index)
);

create index laps_run_id_idx on laps(run_id);
```

### `weather`
Weather snapshot at time and location of each run. One row per run.

```sql
create table weather (
  id              uuid primary key default gen_random_uuid(),
  run_id          uuid not null unique references runs(id) on delete cascade,
  temp_c          numeric(4,1),            -- temperature celsius
  feels_like_c    numeric(4,1),
  humidity_pct    integer,                 -- 0-100
  wind_kph        numeric(5,1),
  wind_dir_deg    integer,
  conditions      text,                    -- 'Sunny', 'Partly cloudy', etc.
  weather_code    integer,                 -- WMO weather code
  fetched_at      timestamptz default now()
);
```

### `training_load`
Daily CTL/ATL/TSB snapshots. Recomputed on every new run ingestion.

```sql
create table training_load (
  id          uuid primary key default gen_random_uuid(),
  date        date not null unique,
  ctl         numeric(6,2) default 0,     -- chronic training load (fitness)
  atl         numeric(6,2) default 0,     -- acute training load (fatigue)
  tsb         numeric(6,2) default 0,     -- training stress balance (form)
  daily_tss   numeric(6,2) default 0,     -- TSS for this day
  updated_at  timestamptz default now()
);

create index training_load_date_idx on training_load(date desc);
```

### `ai_insights`
Cached AI coaching responses. Keyed by prompt hash to avoid re-generation.

```sql
create table ai_insights (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid references runs(id) on delete set null,  -- nullable
  insight_type  text not null check (insight_type in (
                  'training_load_analysis',
                  'race_predictor',
                  'anomaly_detection',
                  'weather_correlation'
                )),
  prompt_hash   text not null,             -- SHA-256 of the prompt
  content       text not null,             -- Claude's response
  model         text not null,
  input_tokens  integer,
  output_tokens integer,
  generated_at  timestamptz default now(),
  unique(prompt_hash)
);

create index ai_insights_run_id_idx on ai_insights(run_id);
create index ai_insights_type_idx on ai_insights(insight_type);
create index ai_insights_hash_idx on ai_insights(prompt_hash);
```

### `settings`
Single-row settings table for the user.

```sql
create table settings (
  id                  uuid primary key default gen_random_uuid(),
  race_date           date,
  race_name           text,
  race_distance_m     integer default 42195,  -- default: marathon
  threshold_hr        integer,                -- lactate threshold HR (bpm)
  threshold_pace_s    integer,                -- threshold pace (s/km)
  unit_preference     text default 'km' check (unit_preference in ('km', 'mi')),
  strava_connected_at timestamptz,
  backfill_completed  boolean default false,
  backfill_count      integer default 0,
  updated_at          timestamptz default now()
);

-- Ensure only one row ever exists
create unique index settings_singleton on settings((true));
```

---

## PostGIS usage

### Compute centroid on insert
```sql
-- Trigger: auto-populate centroid from route geometry
create or replace function compute_centroid()
returns trigger as $$
begin
  if new.route is not null then
    new.centroid := ST_Centroid(new.route);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger runs_centroid_trigger
  before insert or update of route on runs
  for each row execute function compute_centroid();
```

### Useful PostGIS queries

```sql
-- Find runs within 5km of a point (bounding box + exact distance)
select id, date, distance_m from runs
where ST_DWithin(
  route::geography,
  ST_MakePoint(72.8777, 19.0760)::geography,
  5000
);

-- Find runs visible in a map viewport
select id, polyline from runs
where route && ST_MakeEnvelope(72.7, 18.8, 73.1, 19.3, 4326);

-- Cluster runs geographically (for hotspot detection)
select
  ST_ClusterDBSCAN(centroid, eps := 0.01, minpoints := 3) over () as cluster_id,
  count(*) as run_count,
  ST_AsGeoJSON(ST_Centroid(ST_Collect(route))) as cluster_centre
from runs
where centroid is not null
group by cluster_id
order by run_count desc
limit 5;

-- City breakdown
select
  city, country,
  count(*) as run_count,
  sum(distance_m) / 1000.0 as total_km
from runs
where city is not null
group by city, country
order by total_km desc;
```

---

## Row Level Security
Since this is a single-user app, RLS is simple — all operations require
the service role key (used only server-side).

```sql
-- Enable RLS on all tables
alter table runs enable row level security;
alter table laps enable row level security;
alter table weather enable row level security;
alter table training_load enable row level security;
alter table ai_insights enable row level security;
alter table settings enable row level security;

-- Service role bypasses RLS automatically (Supabase default)
-- No additional policies needed for single-user server-side access
```

---

## Migration naming convention
```
supabase/migrations/
  0001_initial_schema.sql
  0002_add_training_load.sql
  0003_add_ai_insights.sql
  ...
```

Run migrations: `supabase db push`
