import { IconX, IconRoad, IconClock, IconHeartRateMonitor, IconMountain, IconCloud } from '@tabler/icons-react'
import type { RunWithWeather, RunWithLaps } from '@/types/database'

type DetailRun = RunWithWeather & RunWithLaps

interface RunDetailPanelProps {
  run: DetailRun | null
  loading: boolean
  onClose: () => void
}

const TYPE_STYLE: Record<string, string> = {
  easy:  'bg-[var(--easy-bg)]  text-[var(--easy)]',
  tempo: 'bg-[var(--tempo-bg)] text-[var(--tempo)]',
  long:  'bg-[var(--long-bg)]  text-[var(--long)]',
  race:  'bg-[var(--race-bg)]  text-[var(--race)]',
}

function fmt(n: number, decimals = 0) { return n.toFixed(decimals) }

function formatPace(s: number | null) {
  if (!s) return '—'
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`
}

function formatDuration(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h ? `${h}h ${m}m` : `${m}m ${String(s % 60).padStart(2, '0')}s`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function RunDetailPanel({ run, loading, onClose }: RunDetailPanelProps) {
  if (!loading && !run) return null

  return (
    <div className="w-full md:w-[272px] shrink-0 bg-[var(--surface)] border border-[var(--border)]
      rounded-[10px] overflow-hidden flex flex-col self-start">

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <span className="text-[12px] text-[var(--text3)] font-inter">Loading…</span>
        </div>
      ) : run && (
        <>
          {/* Header */}
          <div className="flex items-start justify-between p-4 border-b border-[var(--border)]">
            <div className="space-y-1">
              {run.run_type && (
                <span className={[
                  'inline-block text-[10px] px-2 py-0.5 rounded-full font-inter capitalize',
                  TYPE_STYLE[run.run_type] ?? TYPE_STYLE.easy,
                ].join(' ')}>
                  {run.run_type}
                </span>
              )}
              <p className="text-[12px] text-[var(--text2)] font-inter">{formatDate(run.date)}</p>
              {run.city && (
                <p className="text-[11px] text-[var(--text3)] font-inter">
                  {run.city}{run.country ? `, ${run.country}` : ''}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-[5px] text-[var(--text3)] hover:bg-[var(--surface2)] transition-colors"
            >
              <IconX size={14} />
            </button>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: <IconRoad size={13} />,             label: 'Distance',  val: `${fmt(run.distance_m / 1000, 2)} km` },
                { icon: <IconClock size={13} />,            label: 'Duration',  val: formatDuration(run.duration_s) },
                { icon: <IconClock size={13} />,            label: 'Avg pace',  val: formatPace(run.avg_pace_s) + ' /km' },
                { icon: <IconHeartRateMonitor size={13} />, label: 'Avg HR',    val: run.avg_hr ? `${run.avg_hr} bpm` : '—' },
                { icon: <IconHeartRateMonitor size={13} />, label: 'Max HR',    val: run.max_hr ? `${run.max_hr} bpm` : '—' },
                { icon: <IconMountain size={13} />,         label: 'Elevation', val: `${run.elevation_m} m` },
              ].map((s) => (
                <div key={s.label} className="bg-[var(--surface2)] rounded-[7px] p-3">
                  <div className="flex items-center gap-1 text-[var(--text3)] text-[10px] mb-1 font-inter">
                    {s.icon}{s.label}
                  </div>
                  <div className="text-[13px] font-medium font-mono text-[var(--text)]">{s.val}</div>
                </div>
              ))}
            </div>

            {/* Weather */}
            {run.weather && (
              <div>
                <div className="flex items-center gap-1 text-[11px] text-[var(--text2)] font-inter mb-2">
                  <IconCloud size={12} /> Weather
                </div>
                <div className="bg-[var(--surface2)] rounded-[7px] p-3 flex flex-wrap gap-3">
                  {[
                    { k: 'Temp',       v: run.weather.temp_c       !== null ? `${run.weather.temp_c}°C` : null },
                    { k: 'Feels like', v: run.weather.feels_like_c !== null ? `${run.weather.feels_like_c}°C` : null },
                    { k: 'Humidity',   v: run.weather.humidity_pct !== null ? `${run.weather.humidity_pct}%` : null },
                    { k: 'Wind',       v: run.weather.wind_kph     !== null ? `${run.weather.wind_kph} km/h` : null },
                    { k: 'Conditions', v: run.weather.conditions },
                  ].filter((x) => x.v).map((x) => (
                    <div key={x.k}>
                      <div className="text-[10px] text-[var(--text3)] font-inter">{x.k}</div>
                      <div className="text-[12px] font-medium font-mono text-[var(--text)]">{x.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lap splits */}
            {run.laps.length > 0 && (
              <div>
                <div className="text-[11px] text-[var(--text2)] font-inter mb-2">Lap splits</div>
                <div className="bg-[var(--surface2)] rounded-[7px] overflow-hidden">
                  <table className="w-full text-[11px] font-inter">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        {['Lap', 'Dist', 'Pace', 'HR'].map((h) => (
                          <th key={h} className="text-[var(--text3)] font-normal px-3 py-2 text-right first:text-left">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {run.laps.map((lap) => (
                        <tr key={lap.lap_index} className="border-b border-[var(--border)] last:border-0">
                          <td className="px-3 py-2 text-[var(--text2)]">{lap.lap_index}</td>
                          <td className="px-3 py-2 text-right font-mono text-[var(--text)]">{fmt(lap.distance_m / 1000, 2)} km</td>
                          <td className="px-3 py-2 text-right font-mono text-[var(--text)]">{formatPace(lap.avg_pace_s)}</td>
                          <td className="px-3 py-2 text-right font-mono text-[var(--text)]">{lap.avg_hr ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
