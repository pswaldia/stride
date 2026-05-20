import { getHeatmapRuns, getMapStats, getCityBreakdown, getHotspots } from '@/lib/supabase/queries'
import { MapClient } from './MapClient'

export default async function MapPage() {
  const [runs, stats, cities, hotspots] = await Promise.all([
    getHeatmapRuns(),
    getMapStats(),
    getCityBreakdown(),
    getHotspots(),
  ])

  return (
    // This page needs full viewport height minus the sidebar header
    <div className="h-[calc(100vh)] md:h-screen">
      <MapClient
        runs={runs}
        hotspots={hotspots}
        stats={stats}
        cities={cities}
      />
    </div>
  )
}
