'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Run } from '@/types/database'

interface TssChartProps {
  runs: Run[]   // last 4 weeks
}

const TYPE_COLOR: Record<string, string> = {
  easy:  'var(--easy)',
  tempo: 'var(--tempo)',
  long:  'var(--long)',
  race:  'var(--race)',
}

function dayLabel(dateStr: string) {
  const d = new Date(dateStr)
  const dow = d.toLocaleDateString('en-US', { weekday: 'short' })
  const day = d.getDate()
  return `${dow} ${day}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px] px-3 py-2 text-[12px] shadow-md">
      <div className="text-[var(--text3)] font-inter mb-1">{dayLabel(d.date)}</div>
      <div className="flex justify-between gap-4">
        <span className="font-inter text-[var(--text2)] capitalize">{d.run_type ?? 'rest'}</span>
        <span className="font-mono font-medium text-[var(--text)]">{d.tss?.toFixed(1) ?? '0'} TSS</span>
      </div>
    </div>
  )
}

export function TssChart({ runs }: TssChartProps) {
  // Build one entry per calendar day for last 28 days
  const today    = new Date()
  const cutoff   = new Date(today)
  cutoff.setDate(today.getDate() - 27)

  // Map date → dominant run
  const byDate = new Map<string, Run>()
  for (const run of runs) {
    const existing = byDate.get(run.date)
    if (!existing || (run.tss ?? 0) > (existing.tss ?? 0)) {
      byDate.set(run.date, run)
    }
  }

  const chartData: Array<{ date: string; tss: number | null; run_type: string | null }> = []
  const cursor = new Date(cutoff)
  while (cursor <= today) {
    const ds  = cursor.toISOString().substring(0, 10)
    const run = byDate.get(ds)
    chartData.push({
      date:     ds,
      tss:      run?.tss ?? null,
      run_type: run?.run_type ?? null,
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[13px] font-medium font-inter text-[var(--text)]">
          Daily TSS
        </span>
        <span className="text-[11px] text-[var(--text3)] font-inter">Last 4 weeks</span>
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={chartData} barSize={8} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => {
              const day = new Date(d).getDate()
              return day === 1 || new Date(d).getDay() === 1 ? dayLabel(d) : ''
            }}
            tick={{ fontSize: 9, fill: 'var(--text3)', fontFamily: 'var(--font-inter)' }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 9, fill: 'var(--text3)', fontFamily: 'var(--font-inter)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface2)' }} />
          <Bar dataKey="tss" radius={[2, 2, 0, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.date}
                fill={entry.run_type ? (TYPE_COLOR[entry.run_type] ?? 'var(--easy)') : 'transparent'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-[var(--border)]">
        {Object.entries(TYPE_COLOR).map(([type]) => (
          <div key={type} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ background: TYPE_COLOR[type] }} />
            <span className="text-[10px] text-[var(--text3)] font-inter capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
