import {
  IconRoad,
  IconRun,
  IconRoute,
  IconMapPin,
  IconMountain,
} from '@tabler/icons-react'
import type { MapStats } from '@/types/database'

interface MapStatsPanelProps { stats: MapStats }

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

export function MapStatsPanel({ stats }: MapStatsPanelProps) {
  const items = [
    { icon: <IconRoad size={13} />,    label: 'Total distance',  value: `${stats.total_km.toFixed(1)}`, unit: 'km' },
    { icon: <IconRun size={13} />,     label: 'Total runs',      value: String(stats.total_runs),        unit: 'runs' },
    { icon: <IconRoute size={13} />,   label: 'Unique routes',   value: String(stats.unique_routes),     unit: 'routes' },
    { icon: <IconMapPin size={13} />,  label: 'Cities explored', value: String(stats.cities_explored),   unit: 'cities' },
    { icon: <IconMountain size={13} />,label: 'Elevation',       value: fmt(stats.total_elevation_m),    unit: 'm' },
  ]

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <div key={item.label}
          className="bg-[var(--surface2)] rounded-[8px] p-3">
          <div className="flex items-center gap-1 text-[var(--text3)] text-[10px] font-jakarta mb-1">
            {item.icon}
            {item.label}
          </div>
          <div className="text-[var(--text)] text-[16px] font-medium font-outfit tracking-tight leading-none">
            {item.value}
            <span className="text-[var(--text3)] text-[10px] font-normal"> {item.unit}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
