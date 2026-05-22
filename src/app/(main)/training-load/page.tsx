import {
  getTrainingLoadHistory,
  getLatestTrainingLoad,
  getSettings,
  getRuns,
} from '@/lib/supabase/queries'
import { TrainingLoadChart } from '@/components/charts/TrainingLoadChart'
import { TssChart } from '@/components/charts/TssChart'
import type { TrainingLoad, Settings } from '@/types/database'

// ─── TSB badge ────────────────────────────────────────────────────────────────

function formStatus(tsb: number): { label: string; className: string } {
  if (tsb > 10)             return { label: 'Peaking',     className: 'bg-[var(--accent-bg)] text-[var(--accent)]' }
  if (tsb >= 0)             return { label: 'Fresh',       className: 'bg-[var(--easy-bg)]   text-[var(--easy)]' }
  if (tsb >= -10)           return { label: 'Fatigued',    className: 'bg-[var(--tempo-bg)]  text-[var(--tempo)]' }
  return                           { label: 'Deep fatigue',className: 'bg-[var(--long-bg)]   text-[var(--long)]' }
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function LoadCard({
  label, sublabel, value, colorVar, badge,
}: {
  label:    string
  sublabel: string
  value:    number
  colorVar: string
  badge?:   React.ReactNode
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-5 flex-1">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[13px] font-medium font-inter text-[var(--text)]">{label}</div>
          <div className="text-[11px] text-[var(--text3)] font-inter mt-0.5">{sublabel}</div>
        </div>
        {badge}
      </div>
      <div
        className="text-[36px] font-medium font-mono leading-none"
        style={{ color: `var(${colorVar})` }}
      >
        {value >= 0 ? '' : '−'}{Math.abs(value).toFixed(1)}
      </div>
    </div>
  )
}

// ─── Interpretation panel ─────────────────────────────────────────────────────

function InterpretationPanel({
  latest,
  history,
  settings,
}: {
  latest:   TrainingLoad | null
  history:  TrainingLoad[]
  settings: Settings | null
}) {
  if (!latest) {
    return (
      <aside className="w-full md:w-[280px] shrink-0 bg-[var(--surface)] border border-[var(--border)]
        rounded-[10px] p-4 space-y-4">
        <p className="text-[12px] text-[var(--text3)] font-inter">
          No training load data yet. Run the backfill first.
        </p>
      </aside>
    )
  }

  const { label, className } = formStatus(latest.tsb)

  // Weekly ramp = CTL today − CTL 7 days ago
  const week7     = history.length >= 7 ? history[history.length - 7] : null
  const ramp      = week7 ? latest.ctl - week7.ctl : null
  const rampColor = ramp === null ? 'text-[var(--text2)]'
    : ramp > 8  ? 'text-[var(--long)]'
    : ramp > 5  ? 'text-[var(--tempo)]'
    : 'text-[var(--easy)]'

  // Race countdown
  let raceCountdown: React.ReactNode = null
  if (settings?.race_date) {
    const raceDate = new Date(settings.race_date)
    const today    = new Date()
    const days     = Math.ceil((raceDate.getTime() - today.getTime()) / 86_400_000)
    raceCountdown = days > 0 ? (
      <div>
        <div className="text-[11px] text-[var(--text3)] font-inter mb-0.5">Race countdown</div>
        <div className="text-[20px] font-medium font-mono text-[var(--text)]">{days}</div>
        <div className="text-[11px] text-[var(--text2)] font-inter">
          days to {settings.race_name ?? 'race day'}
        </div>
      </div>
    ) : (
      <div className="text-[11px] text-[var(--text2)] font-inter">Race day has passed.</div>
    )
  } else {
    raceCountdown = (
      <div className="text-[11px] text-[var(--text3)] font-inter">
        No race set — add one in Settings.
      </div>
    )
  }

  // Taper trajectory
  let taperNote: React.ReactNode = null
  if (settings?.race_date) {
    const daysToRace = Math.ceil(
      (new Date(settings.race_date).getTime() - Date.now()) / 86_400_000
    )
    if (daysToRace > 0 && daysToRace <= 30) {
      const onTrack = latest.tsb >= 0
      taperNote = (
        <div className={`text-[11px] font-inter ${onTrack ? 'text-[var(--easy)]' : 'text-[var(--tempo)]'}`}>
          Taper: {onTrack ? 'On track (TSB ≥ 0)' : 'May need more rest'}
        </div>
      )
    }
  }

  return (
    <aside className="w-full md:w-[280px] shrink-0 bg-[var(--surface)] border border-[var(--border)]
      rounded-[10px] p-4 space-y-5">

      {/* Form badge */}
      <div>
        <div className="text-[11px] text-[var(--text3)] font-inter mb-2">Current form</div>
        <span className={`text-[13px] font-medium font-inter px-3 py-1.5 rounded-[7px] ${className}`}>
          {label}
        </span>
        <div className="text-[11px] text-[var(--text3)] font-inter mt-2">
          TSB <span className="font-mono text-[var(--text)]">{latest.tsb > 0 ? '+' : ''}{latest.tsb.toFixed(1)}</span>
        </div>
      </div>

      <div className="border-t border-[var(--border)]" />

      {/* Ramp rate */}
      <div>
        <div className="text-[11px] text-[var(--text3)] font-inter mb-1">Weekly ramp</div>
        {ramp !== null ? (
          <>
            <div className={`text-[18px] font-medium font-mono ${rampColor}`}>
              {ramp >= 0 ? '+' : ''}{ramp.toFixed(1)}
            </div>
            <div className="text-[11px] text-[var(--text2)] font-inter">CTL this week</div>
            {ramp > 8 && (
              <div className="text-[11px] text-[var(--long)] font-inter mt-1">
                ⚠ Ramp &gt;8 — injury risk
              </div>
            )}
            {ramp > 5 && ramp <= 8 && (
              <div className="text-[11px] text-[var(--tempo)] font-inter mt-1">
                ↑ Building fast — monitor fatigue
              </div>
            )}
          </>
        ) : (
          <div className="text-[11px] text-[var(--text3)] font-inter">Not enough data</div>
        )}
      </div>

      <div className="border-t border-[var(--border)]" />

      {/* Race countdown */}
      <div>
        <div className="text-[11px] text-[var(--text3)] font-inter mb-1.5">Race day</div>
        {raceCountdown}
        {taperNote}
      </div>

      <div className="border-t border-[var(--border)]" />

      {/* Taper target */}
      <div>
        <div className="text-[11px] text-[var(--text3)] font-inter mb-1">Target TSB at race</div>
        <div className="text-[11px] text-[var(--text2)] font-inter">+5 to +15 (well-rested)</div>
        <div className="text-[11px] text-[var(--text3)] font-inter mt-1">
          Current TSB:{' '}
          <span className="font-mono text-[var(--text)]">
            {latest.tsb > 0 ? '+' : ''}{latest.tsb.toFixed(1)}
          </span>
        </div>
      </div>
    </aside>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TrainingLoadPage() {
  const today     = new Date()
  const month4Ago = new Date(today)
  month4Ago.setDate(today.getDate() - 28)
  const month4Str = month4Ago.toISOString().substring(0, 10)

  const [history, latest, settings, recentRuns] = await Promise.all([
    getTrainingLoadHistory(120),
    getLatestTrainingLoad(),
    getSettings(),
    getRuns({ startDate: month4Str, limit: 200 }),
  ])

  const raceDays = history
    .filter((_) => false) // populated from runs with run_type=race
    .map(r => r.date)

  // Get race days from recent runs
  const raceRunDays = recentRuns
    .filter(r => r.run_type === 'race')
    .map(r => r.date)

  return (
    <div className="p-6 md:p-7 space-y-5">

      <div>
        <h1 className="text-[18px] font-medium font-inter text-[var(--text)]">Training load</h1>
        <p className="text-[12px] text-[var(--text3)] font-inter mt-0.5">
          Fitness, fatigue and form over time
        </p>
      </div>

      {latest ? (
        <>
          {/* Summary cards */}
          <div className="flex flex-col md:flex-row gap-3">
            <LoadCard
              label="Fitness"
              sublabel="Chronic training load · 42-day avg"
              value={latest.ctl}
              colorVar="--ctl-color"
            />
            <LoadCard
              label="Fatigue"
              sublabel="Acute training load · 7-day avg"
              value={latest.atl}
              colorVar="--atl-color"
            />
            <LoadCard
              label="Form"
              sublabel="Training stress balance"
              value={latest.tsb}
              colorVar="--tsb-color"
              badge={
                <span className={`text-[10px] font-inter px-2 py-0.5 rounded-full ${formStatus(latest.tsb).className}`}>
                  {formStatus(latest.tsb).label}
                </span>
              }
            />
          </div>

          {/* Charts + interpretation panel */}
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="flex-1 min-w-0 space-y-4">
              <TrainingLoadChart data={history} raceDays={raceRunDays} />
              <TssChart runs={recentRuns} />
            </div>
            <InterpretationPanel
              latest={latest}
              history={history}
              settings={settings}
            />
          </div>
        </>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-8
          flex flex-col items-center gap-3 text-center max-w-md">
          <p className="text-[14px] font-medium font-inter text-[var(--text)]">
            No training load data
          </p>
          <p className="text-[12px] text-[var(--text3)] font-inter">
            Run the backfill to compute your CTL, ATL, and TSB from all historical runs.
          </p>
          <code className="text-[11px] bg-[var(--surface2)] px-3 py-1.5 rounded-[6px] text-[var(--text2)] font-mono">
            curl -X POST http://localhost:3000/api/admin/training-load
          </code>
        </div>
      )}
    </div>
  )
}
