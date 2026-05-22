import Link from 'next/link'
import type { Route } from 'next'
import type { TrainingLoad } from '@/types/database'

interface TrainingLoadMiniProps { load: TrainingLoad | null }

function statusFor(tsb: number) {
  if (tsb > 10)   return { label: 'Peaking',      color: 'text-[var(--accent)]' }
  if (tsb >= 0)   return { label: 'Fresh',         color: 'text-[var(--easy)]' }
  if (tsb >= -10) return { label: 'Fatigued',      color: 'text-[var(--tempo)]' }
  return                  { label: 'Deep fatigue', color: 'text-[var(--long)]' }
}

interface BarProps { label: string; value: number; max: number; colorVar: string }

function Bar({ label, value, max, colorVar }: BarProps) {
  const pct = Math.min(Math.round((Math.abs(value) / max) * 100), 100)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] font-inter">
        <span className="text-[var(--text3)]">{label}</span>
        <span className="text-[var(--text)] font-medium font-mono">
          {value > 0 ? '+' : ''}{value.toFixed(1)}
        </span>
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
        <span className="text-[13px] font-medium font-inter text-[var(--text)]">
          Training load
        </span>
        <div className="flex items-center gap-2">
          {load && (
            <span className={['text-[11px] font-inter', statusFor(load.tsb).color].join(' ')}>
              {statusFor(load.tsb).label}
            </span>
          )}
          <Link
            href={'/training-load' as Route}
            className="text-[11px] text-[var(--accent)] font-inter hover:underline"
          >
            Details ›
          </Link>
        </div>
      </div>

      {load ? (
        <div className="space-y-2.5">
          <Bar label="CTL — Fitness" value={load.ctl} max={120} colorVar="--ctl-color" />
          <Bar label="ATL — Fatigue" value={load.atl} max={120} colorVar="--atl-color" />
          <Bar label="TSB — Form"    value={load.tsb} max={50}  colorVar="--tsb-color" />
        </div>
      ) : (
        <p className="text-[12px] text-[var(--text3)] font-inter">
          No training load data yet.{' '}
          <Link href={'/training-load' as Route} className="text-[var(--accent)] hover:underline">
            Run the backfill →
          </Link>
        </p>
      )}
    </div>
  )
}
