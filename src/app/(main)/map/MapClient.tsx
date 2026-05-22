'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { MapFilters } from '@/components/map/MapFilters'
import { CityPanel } from '@/components/map/CityPanel'
import { MapStatsPanel } from '@/components/map/MapStatsPanel'
import type { HeatmapRun, Hotspot, MapStats, CityRow } from '@/types/database'
import type { RunTypeFilter, TimeRangeFilter } from '@/components/map/HeatmapMap'
import { IconRobot, IconArrowRight } from '@tabler/icons-react'

// Mapbox GL can't run server-side — dynamic import with ssr: false
const HeatmapMap = dynamic(
  () => import('@/components/map/HeatmapMap').then((m) => m.HeatmapMap),
  { ssr: false, loading: () => <MapSkeleton /> }
)

function MapSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[var(--surface2)]">
      <span className="text-[12px] text-[var(--text3)] font-inter">Loading map…</span>
    </div>
  )
}

interface MapClientProps {
  runs:     HeatmapRun[]
  hotspots: Hotspot[]
  stats:    MapStats
  cities:   CityRow[]
}

export function MapClient({ runs, hotspots, stats, cities }: MapClientProps) {
  const [runTypeFilter, setRunTypeFilter] = useState<RunTypeFilter>('all')
  const [timeFilter,    setTimeFilter]    = useState<TimeRangeFilter>('all')

  return (
    <div className="flex h-full">
      {/* Map — fills available space */}
      <div className="flex-1 min-w-0 relative">
        <HeatmapMap
          initialRuns={runs}
          hotspots={hotspots}
          centerLat={stats.center_lat}
          centerLng={stats.center_lng}
          runTypeFilter={runTypeFilter}
          timeFilter={timeFilter}
        />
      </div>

      {/* Right panel — fixed 300px, scrollable */}
      <aside className="hidden md:flex flex-col w-[300px] shrink-0 h-full
        border-l border-[var(--border)] bg-[var(--surface)] overflow-y-auto">
        <div className="p-4 space-y-5">

          {/* Map stats */}
          <div>
            <h2 className="text-[13px] font-medium font-inter text-[var(--text)] mb-3">
              Overview
            </h2>
            <MapStatsPanel stats={stats} />
          </div>

          <div className="border-t border-[var(--border)]" />

          {/* Filters */}
          <div>
            <h2 className="text-[13px] font-medium font-inter text-[var(--text)] mb-3">
              Filter
            </h2>
            <MapFilters
              runType={runTypeFilter}
              timeRange={timeFilter}
              onRunType={setRunTypeFilter}
              onTimeRange={setTimeFilter}
            />
          </div>

          <div className="border-t border-[var(--border)]" />

          {/* City breakdown */}
          <CityPanel cities={cities} />

          <div className="border-t border-[var(--border)]" />

          {/* AI route insight — placeholder until M5 */}
          <div className="bg-[var(--accent-bg)] border border-[var(--accent-border)] rounded-[10px] p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-[26px] h-[26px] bg-[var(--accent)] rounded-[6px]
                flex items-center justify-center text-white">
                <IconRobot size={14} />
              </div>
              <span className="text-[13px] font-medium font-inter text-[var(--accent)]">
                Route insight
              </span>
            </div>
            <p className="text-[12px] text-[var(--text2)] font-inter leading-[1.65]">
              AI route analysis will be available in M5. It will identify your most
              frequent routes, flag high-fatigue patterns, and suggest new areas
              to explore.
            </p>
            <button className="mt-2.5 text-[12px] text-[var(--accent)] font-inter
              flex items-center gap-1 opacity-50 cursor-not-allowed">
              Full analysis <IconArrowRight size={12} />
            </button>
          </div>

        </div>
      </aside>
    </div>
  )
}
