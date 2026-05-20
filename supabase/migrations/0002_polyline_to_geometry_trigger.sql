-- Migration: 0002_polyline_to_geometry_trigger.sql
-- Extends the centroid trigger to also decode polyline → route on every insert/update.
-- This ensures route and centroid are always populated when a polyline is present.

-- Update function to decode polyline → route, then compute centroid
CREATE OR REPLACE FUNCTION compute_run_centroid()
RETURNS trigger AS $$
BEGIN
  IF NEW.polyline IS NOT NULL AND length(NEW.polyline) > 0 THEN
    NEW.route := ST_LineFromEncodedPolyline(NEW.polyline);
  END IF;
  IF NEW.route IS NOT NULL THEN
    NEW.centroid := ST_Centroid(NEW.route);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace trigger to fire on every INSERT/UPDATE (not just route changes)
DROP TRIGGER IF EXISTS runs_centroid_trigger ON runs;
CREATE TRIGGER runs_centroid_trigger
  BEFORE INSERT OR UPDATE ON runs
  FOR EACH ROW EXECUTE FUNCTION compute_run_centroid();
