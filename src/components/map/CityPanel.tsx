import type { CityRow } from '@/types/database'

interface CityPanelProps { cities: CityRow[] }

export function CityPanel({ cities }: CityPanelProps) {
  if (!cities.length) return null

  const maxKm = cities[0]?.total_km ?? 1

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-medium font-inter text-[var(--text)]">
          Cities
        </span>
        <span className="text-[11px] text-[var(--text3)] font-inter">
          {cities.length} {cities.length === 1 ? 'city' : 'cities'}
        </span>
      </div>

      <div className="space-y-2.5">
        {cities.map((c, idx) => (
          <div key={`${c.city}-${c.country}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] text-[var(--text3)] font-inter w-4 shrink-0">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <span className="text-[12px] text-[var(--text)] font-inter truncate block">
                    {c.city}
                  </span>
                  {c.country && (
                    <span className="text-[10px] text-[var(--text3)] font-inter">
                      {c.country}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <div className="text-[12px] font-medium font-mono text-[var(--text)]">
                  {c.total_km.toFixed(1)} km
                </div>
                <div className="text-[10px] text-[var(--text3)] font-inter">
                  {c.run_count} {c.run_count === 1 ? 'run' : 'runs'}
                </div>
              </div>
            </div>
            <div className="h-1 rounded-full bg-[var(--surface2)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all"
                style={{ width: `${Math.round((c.total_km / maxKm) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
