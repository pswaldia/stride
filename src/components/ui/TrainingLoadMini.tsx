import type { TrainingLoad } from '@/types/database'

interface TrainingLoadMiniProps {
  load: TrainingLoad | null
}

const STATUS_MAP: Array<{
  test: (tsb: number) => boolean
  label: string
  color: string
}> = [
  { test: (t) => t > 10,             label: 'Good form',    color: 'text-[var(--easy)]' },
  { test: (t) => t >= -10 && t <= 10, label: 'Neutral',     color: 'text-[var(--text2)]' },
  { test: (t) => t < -20,            label: 'Fatigued',     color: 'text-[var(--long)]' },
  { test: (t) => t >= -20 && t < -10, label: 'Freshening', color: 'text-[var(--tempo)]' },
]

function statusFor(tsb: number) {
  return STATUS_MAP.find((s) => s.test(tsb)) ?? STATUS_MAP[1]
}

interface BarProps { label: string; value: number; max: number; colorVar: string }

function Bar({ label, value, max, colorVar }: BarProps) {
  const pct = Math.min(Math.round((value / max) * 100), 100)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] font-jakarta">
        <span className="text-[var(--text3)]">{label}</span>
        <span className="text-[var(--text)] font-medium font-outfit">{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--surface2)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: `var(${colorVar})` }}
        />
      </div>
    </div>
  )
}

export function TrainingLoadMini({ load }: TrainingLoadMiniProps) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4">
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-[13px] font-medium font-outfit text-[var(--text)]">
          Training load
        </span>
        {load && (
          <span className={['text-[11px] font-jakarta', statusFor(load.tsb).color].join(' ')}>
            {statusFor(load.tsb).label}
          </span>
        )}
      </div>

      {load ? (
        <div className="space-y-2.5">
          <Bar label="CTL — Fitness"  value={load.ctl} max={120} colorVar="--ctl-color" />
          <Bar label="ATL — Fatigue"  value={load.atl} max={120} colorVar="--atl-color" />
          <Bar label="TSB — Form"     value={Math.abs(load.tsb)} max={50} colorVar="--tsb-color" />
        </div>
      ) : (
        <p className="text-[12px] text-[var(--text3)] font-jakarta">
          No training load data yet. Load is computed after enough runs are ingested.
        </p>
      )}
    </div>
  )
}
