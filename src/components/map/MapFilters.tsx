'use client'

import type { RunTypeFilter, TimeRangeFilter } from './HeatmapMap'

interface MapFiltersProps {
  runType:       RunTypeFilter
  timeRange:     TimeRangeFilter
  onRunType:     (v: RunTypeFilter) => void
  onTimeRange:   (v: TimeRangeFilter) => void
}

const RUN_TYPE_OPTIONS: { value: RunTypeFilter; label: string }[] = [
  { value: 'all',   label: 'All' },
  { value: 'easy',  label: 'Easy' },
  { value: 'tempo', label: 'Tempo' },
  { value: 'long',  label: 'Long' },
  { value: 'race',  label: 'Race' },
]

const TIME_OPTIONS: { value: TimeRangeFilter; label: string }[] = [
  { value: 'all',      label: 'All time' },
  { value: '3months',  label: '3 months' },
  { value: 'thismonth', label: 'This month' },
]

function Pill<T extends string>({
  value, label, active, onClick,
}: {
  value: T
  label: string
  active: boolean
  onClick: (v: T) => void
}) {
  return (
    <button
      onClick={() => onClick(value)}
      className={[
        'px-2.5 py-1 rounded-full text-[11px] font-jakarta transition-colors whitespace-nowrap',
        active
          ? 'bg-[var(--accent)] text-[#FAF9F6]'
          : 'bg-[var(--surface2)] text-[var(--text2)] hover:bg-[var(--border2)] hover:text-[var(--text)]',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

export function MapFilters({ runType, timeRange, onRunType, onTimeRange }: MapFiltersProps) {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-[10px] text-[var(--text3)] font-jakarta mb-1.5 uppercase tracking-wide">
          Run type
        </div>
        <div className="flex flex-wrap gap-1.5">
          {RUN_TYPE_OPTIONS.map((o) => (
            <Pill
              key={o.value}
              value={o.value}
              label={o.label}
              active={runType === o.value}
              onClick={onRunType}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] text-[var(--text3)] font-jakarta mb-1.5 uppercase tracking-wide">
          Time range
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TIME_OPTIONS.map((o) => (
            <Pill
              key={o.value}
              value={o.value}
              label={o.label}
              active={timeRange === o.value}
              onClick={onTimeRange}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
