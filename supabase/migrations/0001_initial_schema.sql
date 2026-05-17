-- Migration: 0001_initial_schema.sql
-- Stride initial database schema with PostGIS

-- ─── Extensions ──────────────────────────────────────────────────────
create extension if not exists postgis;

-- ─── Runs ────────────────────────────────────────────────────────────
create table runs (
  id              uuid primary key default gen_random_uuid(),
  strava_id       bigint unique not null,
  date            date not null,
  started_at      timestamptz not null,
  distance_m      integer not null,
  duration_s      integer not null,
  avg_hr          integer,
  max_hr          integer,
  avg_pace_s      integer,
  elevation_m     integer default 0,
  polyline        text,
  route           geometry(LineString, 4326),
  centroid        geometry(Point, 4326),
  city            text,
  country         text,
  run_type        text check (run_type in ('easy', 'tempo', 'long', 'race')),
  tss             numeric(6, 2),
  raw_json        jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index runs_date_idx      on runs (date desc);
create index runs_strava_id_idx on runs (strava_id);
create index runs_run_type_idx  on runs (run_type);
create index runs_city_idx      on runs (city);
create index runs_route_idx     on runs using gist (route);
create index runs_centroid_idx  on runs using gist (centroid);

-- Auto-compute centroid from route geometry on insert/update
create or replace function compute_run_centroid()
returns trigger as $$
begin
  if new.route is not null then
    new.centroid := st_centroid(new.route);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger runs_centroid_trigger
  before insert or update of route on runs
  for each row execute function compute_run_centroid();

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger runs_updated_at_trigger
  before update on runs
  for each row execute function update_updated_at();

-- ─── Laps ────────────────────────────────────────────────────────────
create table laps (
  id          uuid primary key default gen_random_uuid(),
  run_id      uuid not null references runs (id) on delete cascade,
  lap_index   integer not null,
  distance_m  integer not null,
  elapsed_s   integer not null,
  avg_hr      integer,
  avg_pace_s  integer,
  created_at  timestamptz default now(),
  unique (run_id, lap_index)
);

create index laps_run_id_idx on laps (run_id);

-- ─── Weather ─────────────────────────────────────────────────────────
create table weather (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid not null unique references runs (id) on delete cascade,
  temp_c        numeric(4, 1),
  feels_like_c  numeric(4, 1),
  humidity_pct  integer,
  wind_kph      numeric(5, 1),
  wind_dir_deg  integer,
  conditions    text,
  weather_code  integer,
  fetched_at    timestamptz default now()
);

-- ─── Training load ───────────────────────────────────────────────────
create table training_load (
  id          uuid primary key default gen_random_uuid(),
  date        date not null unique,
  ctl         numeric(6, 2) default 0,
  atl         numeric(6, 2) default 0,
  tsb         numeric(6, 2) default 0,
  daily_tss   numeric(6, 2) default 0,
  updated_at  timestamptz default now()
);

create index training_load_date_idx on training_load (date desc);

-- ─── AI insights ─────────────────────────────────────────────────────
create table ai_insights (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid references runs (id) on delete set null,
  insight_type  text not null check (insight_type in (
                  'training_load_analysis',
                  'race_predictor',
                  'anomaly_detection',
                  'weather_correlation'
                )),
  prompt_hash   text not null,
  content       text not null,
  model         text not null,
  input_tokens  integer,
  output_tokens integer,
  generated_at  timestamptz default now(),
  unique (prompt_hash)
);

create index ai_insights_run_id_idx on ai_insights (run_id);
create index ai_insights_type_idx   on ai_insights (insight_type);
create index ai_insights_hash_idx   on ai_insights (prompt_hash);

-- ─── Settings (singleton) ────────────────────────────────────────────
create table settings (
  id                  uuid primary key default gen_random_uuid(),
  race_date           date,
  race_name           text,
  race_distance_m     integer default 42195,
  threshold_hr        integer,
  threshold_pace_s    integer,
  unit_preference     text default 'km' check (unit_preference in ('km', 'mi')),
  strava_connected_at timestamptz,
  backfill_completed  boolean default false,
  backfill_count      integer default 0,
  updated_at          timestamptz default now()
);

-- Ensure only one row
create unique index settings_singleton on settings ((true));

-- Insert default settings row
insert into settings (id) values (gen_random_uuid());

-- ─── RLS ─────────────────────────────────────────────────────────────
alter table runs            enable row level security;
alter table laps            enable row level security;
alter table weather         enable row level security;
alter table training_load   enable row level security;
alter table ai_insights     enable row level security;
alter table settings        enable row level security;

-- ─── Helper functions ────────────────────────────────────────────────

-- Weekly mileage for the last N weeks
create or replace function get_weekly_mileage(weeks_back integer default 8)
returns table (week_start date, total_km numeric) as $$
begin
  return query
    select
      date_trunc('week', date::timestamptz)::date as week_start,
      round(sum(distance_m) / 1000.0, 1) as total_km
    from runs
    where date >= current_date - (weeks_back * 7)
    group by week_start
    order by week_start desc
    limit weeks_back;
end;
$$ language plpgsql;

-- City breakdown ranked by total km
create or replace function get_city_breakdown()
returns table (
  city text,
  country text,
  run_count bigint,
  total_km numeric
) as $$
begin
  return query
    select
      r.city,
      r.country,
      count(*) as run_count,
      round(sum(r.distance_m) / 1000.0, 1) as total_km
    from runs r
    where r.city is not null
    group by r.city, r.country
    order by total_km desc;
end;
$$ language plpgsql;
