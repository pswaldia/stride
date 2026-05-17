'use client'

import { useState } from 'react'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import type { Run } from '@/types/database'

const DAYS   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const TODAY  = new Date().toISOString().substring(0, 10)

const DOT_COLOR: Record<string, string> = {
  easy:  'bg-[var(--easy)]',
  tempo: 'bg-[var(--tempo)]',
  long:  'bg-[var(--long)]',
  race:  'bg-[var(--race)]',
}

interface TrainingCalendarProps {
  runs: Run[]
  selectedId: string | null
  onSelect: (run: Run) => void
}

function pad(n: number) { return String(n).padStart(2, '0') }

export function TrainingCalendar({ runs, selectedId, onSelect }: TrainingCalendarProps) {
  const now   = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())   // 0-indexed

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }

  const runsByDate = runs.reduce<Record<string, Run>>((acc, r) => {
    if (!acc[r.date]) acc[r.date] = r   // keep first (most significant) per day
    return acc
  }, {})

  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7   // Mon=0
  const daysInMonth    = new Date(year, month + 1, 0).getDate()

  const monthLabel = new Date(year, month, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[13px] font-medium font-outfit text-[var(--text)]">
          {monthLabel}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={prevMonth}
            className="p-1 rounded-[5px] text-[var(--text3)] hover:bg-[var(--surface2)] transition-colors"
          >
            <IconChevronLeft size={14} />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-[5px] text-[var(--text3)] hover:bg-[var(--surface2)] transition-colors"
          >
            <IconChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] text-[var(--text3)] font-jakarta py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day     = i + 1
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`
          const run     = runsByDate[dateStr]
          const isToday = dateStr === TODAY
          const active  = run?.id === selectedId

          return (
            <div
              key={dateStr}
              onClick={() => run && onSelect(run)}
              className={[
                'aspect-square rounded-[6px] flex flex-col items-center justify-center transition-colors',
                run ? 'cursor-pointer' : '',
                active
                  ? 'bg-[var(--accent-bg)] border border-[var(--accent-border)]'
                  : isToday
                    ? 'border border-[var(--accent)]'
                    : 'border border-transparent hover:bg-[var(--surface2)]',
              ].join(' ')}
            >
              <span className={[
                'text-[11px] leading-none font-jakarta',
                isToday ? 'text-[var(--accent)] font-medium' : 'text-[var(--text)]',
              ].join(' ')}>
                {day}
              </span>
              {run && (
                <div className={[
                  'w-[5px] h-[5px] rounded-full mt-0.5',
                  DOT_COLOR[run.run_type ?? 'easy'] ?? 'bg-[var(--easy)]',
                ].join(' ')} />
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border)]">
        {Object.entries(DOT_COLOR).map(([type, cls]) => (
          <div key={type} className="flex items-center gap-1">
            <div className={`w-[6px] h-[6px] rounded-full ${cls}`} />
            <span className="text-[10px] text-[var(--text3)] font-jakarta capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
