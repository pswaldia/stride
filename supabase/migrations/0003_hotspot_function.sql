-- Migration: 0003_hotspot_function.sql
-- Adds get_hotspots() and get_map_center() RPC functions for the map screen.

-- ─── Map center ───────────────────────────────────────────────────────────────
-- Returns the geographic centroid of all runs — used as initial map viewport.

create or replace function get_map_center()
returns table (lat double precision, lng double precision) as $$
begin
  return query
    select
      st_y(st_centroid(st_collect(centroid)))::double precision as lat,
      st_x(st_centroid(st_collect(centroid)))::double precision as lng
    from runs
    where centroid is not null;
end;
$$ language plpgsql;

-- ─── Hotspots ─────────────────────────────────────────────────────────────────
create or replace function get_hotspots()
returns table (
  cluster_id   integer,
  run_count    bigint,
  lng          double precision,
  lat          double precision,
  city_name    text
) as $$
begin
  return query
    with clustered as (
      select
        st_clusterdbscan(centroid, eps := 0.01, minpoints := 3) over () as cid,
        city,
        centroid
      from runs
      where centroid is not null
    ),
    grouped as (
      select
        cid                                                       as cluster_id,
        count(*)                                                  as run_count,
        st_x(st_centroid(st_collect(centroid)))                   as lng,
        st_y(st_centroid(st_collect(centroid)))                   as lat,
        -- most common city name in the cluster
        (
          select c2.city
          from clustered c2
          where c2.cid = clustered.cid and c2.city is not null
          group by c2.city
          order by count(*) desc
          limit 1
        )                                                         as city_name
      from clustered
      where cid is not null
      group by cid
    )
    select
      grouped.cluster_id,
      grouped.run_count,
      grouped.lng,
      grouped.lat,
      grouped.city_name
    from grouped
    order by grouped.run_count desc
    limit 5;
end;
$$ language plpgsql;
