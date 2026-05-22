'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Map, { Source, Layer, Marker, Popup } from 'react-map-gl'
import type { LayerProps } from 'react-map-gl'
import * as polylineLib from 'polyline'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { HeatmapRun, Hotspot } from '@/types/database'
import type { RunType } from '@/types/database'

// ─── Filter types ─────────────────────────────────────────────────────────────

export type RunTypeFilter  = 'all' | RunType
export type TimeRangeFilter = 'all' | '3months' | 'thismonth'

interface HeatmapMapProps {
  initialRuns:   HeatmapRun[]
  hotspots:      Hotspot[]
  centerLat:     number | null
  centerLng:     number | null
  runTypeFilter: RunTypeFilter
  timeFilter:    TimeRangeFilter
}

// ─── Map style ────────────────────────────────────────────────────────────────

function getMapStyle(): string {
  if (typeof document === 'undefined') return 'mapbox://styles/mapbox/dark-v11'
  const dark = document.documentElement.getAttribute('data-theme') === 'dark'
  return dark
    ? 'mapbox://styles/mapbox/dark-v11'
    : 'mapbox://styles/mapbox/light-v11'
}

// ─── GeoJSON builder ──────────────────────────────────────────────────────────

type GeoPoint = GeoJSON.Feature<GeoJSON.Point>
type FeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Point>

function buildGeoJSON(runs: HeatmapRun[]): FeatureCollection {
  const features: GeoPoint[] = []

  for (const run of runs) {
    if (!run.polyline) continue
    try {
      const coords = polylineLib.decode(run.polyline)
      for (const [lat, lng] of coords) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] },
          properties: { run_type: run.run_type },
        })
      }
    } catch {
      // skip malformed polylines
    }
  }

  return { type: 'FeatureCollection', features }
}

// ─── Filter logic ─────────────────────────────────────────────────────────────

function filterRuns(
  runs: HeatmapRun[],
  runType: RunTypeFilter,
  timeRange: TimeRangeFilter
): HeatmapRun[] {
  let filtered = runs

  if (runType !== 'all') {
    filtered = filtered.filter((r) => r.run_type === runType)
  }

  if (timeRange !== 'all') {
    const now   = new Date()
    const cutoff = new Date(now)
    if (timeRange === '3months') cutoff.setMonth(now.getMonth() - 3)
    else cutoff.setDate(1) // this month
    const cutoffStr = cutoff.toISOString().substring(0, 10)
    filtered = filtered.filter((r) => r.date >= cutoffStr)
  }

  return filtered
}

// ─── Heatmap layer config ─────────────────────────────────────────────────────

const heatmapLayer: LayerProps = {
  id:   'heatmap-layer',
  type: 'heatmap',
  paint: {
    'heatmap-weight':    1,
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 12, 4],
    'heatmap-radius':    ['interpolate', ['linear'], ['zoom'], 0, 1, 12, 3, 16, 5],
    'heatmap-opacity':   0.85,
    'heatmap-color': [
      'interpolate', ['linear'], ['heatmap-density'],
      0,    'rgba(47,111,237,0)',
      0.15, 'rgba(47,111,237,0.25)',
      0.4,  'rgba(47,111,237,0.55)',
      0.65, 'rgba(91,143,249,0.75)',
      0.85, 'rgba(91,143,249,0.9)',
      1,    'rgba(133,174,255,1)',
    ],
  },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HeatmapMap({
  initialRuns,
  hotspots,
  centerLat,
  centerLng,
  runTypeFilter,
  timeFilter,
}: HeatmapMapProps) {
  const [mapStyle,  setMapStyle]  = useState(getMapStyle)
  const [geoJSON,   setGeoJSON]   = useState<FeatureCollection>(() =>
    buildGeoJSON(filterRuns(initialRuns, runTypeFilter, timeFilter))
  )
  const [hoveredPin, setHoveredPin] = useState<Hotspot | null>(null)

  // Update map style when theme changes
  const observerRef = useRef<MutationObserver | null>(null)
  useEffect(() => {
    observerRef.current = new MutationObserver(() => setMapStyle(getMapStyle()))
    observerRef.current.observe(document.documentElement, {
      attributes: true, attributeFilter: ['data-theme'],
    })
    return () => observerRef.current?.disconnect()
  }, [])

  // Rebuild GeoJSON when filters change
  useEffect(() => {
    const filtered = filterRuns(initialRuns, runTypeFilter, timeFilter)
    setGeoJSON(buildGeoJSON(filtered))
  }, [initialRuns, runTypeFilter, timeFilter])

  const handlePinEnter = useCallback((h: Hotspot) => setHoveredPin(h), [])
  const handlePinLeave = useCallback(() => setHoveredPin(null), [])

  const defaultLat = hotspots[0]?.lat ?? centerLat ?? 20.5937
  const defaultLng = hotspots[0]?.lng ?? centerLng ?? 78.9629

  // Pin sizes by rank (index 0 = highest run count)
  const PIN_SIZES = [28, 24, 20, 18, 16]

  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{
        latitude:  defaultLat,
        longitude: defaultLng,
        zoom:      11,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={mapStyle}
      reuseMaps
    >
      {/* Heatmap layer */}
      <Source id="heatmap-source" type="geojson" data={geoJSON}>
        <Layer {...heatmapLayer} />
      </Source>

      {/* Hotspot pins */}
      {hotspots.map((h, idx) => (
        <Marker
          key={h.cluster_id}
          latitude={h.lat}
          longitude={h.lng}
          anchor="center"
        >
          <div
            onMouseEnter={() => handlePinEnter(h)}
            onMouseLeave={handlePinLeave}
            className="rounded-full flex items-center justify-center
              font-inter font-medium cursor-pointer
              shadow-[0_2px_8px_rgba(0,0,0,0.5)] hover:scale-110 transition-transform"
            style={{
              width:           PIN_SIZES[idx] ?? 16,
              height:          PIN_SIZES[idx] ?? 16,
              fontSize:        Math.max((PIN_SIZES[idx] ?? 16) * 0.45, 8),
              backgroundColor: 'var(--accent)',
              color:           '#ffffff',
              border:          '2px solid #ffffff',
            }}
          >
            {idx + 1}
          </div>
        </Marker>
      ))}

      {/* Hotspot tooltip */}
      {hoveredPin && (
        <Popup
          latitude={hoveredPin.lat}
          longitude={hoveredPin.lng}
          anchor="bottom"
          offset={20}
          closeButton={false}
          closeOnClick={false}
          className="!p-0 !bg-transparent !border-0 !shadow-none"
        >
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px]
            px-3 py-2 text-[12px] shadow-md min-w-[120px]">
            <div className="font-medium font-inter text-[var(--text)]">
              {hoveredPin.city_name ?? 'Unknown location'}
            </div>
            <div className="text-[var(--text3)] font-inter mt-0.5">
              {hoveredPin.run_count} runs
            </div>
          </div>
        </Popup>
      )}
    </Map>
  )
}
