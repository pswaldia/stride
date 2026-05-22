'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, CartesianGrid,
} from 'recharts'
import type { TrainingLoad } from '@/types/database'

interface TrainingLoadChartProps {
  data:      TrainingLoad[]
  raceDays?: string[]
}

type Range = '4w' | '8w' | '12w' | 'all'

const RANGES: { label: string; value: Range; days: number | null }[] = [
  { label: '4 weeks',  value: '4w',  days: 28 },
  { label: '8 weeks',  value: '8w',  days: 56 },
  { label: '12 weeks', value: '12w', days: 84 },
  { label: 'All time', value: 'all', days: null },
]

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px] px-3 py-2.5
      text-[12px] shadow-md min-w-[140px]">
      <div className="text-[var(--text3)] font-inter mb-1.5">{fmtDate(label)}</div>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <div key={p.name} className="flex justify-between gap-4 items-center">
          <span className="font-inter" style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono font-medium text-[var(--text)]">{p.value.toFixed(1)}</span>
        </div>
      ))}
    </div>
  )
}

export function TrainingLoadChart({ data, raceDays = [] }: TrainingLoadChartProps) {
  const [range, setRange] = useState<Range>('12w')

  const selected = RANGES.find(r => r.value === range)!
  const filtered = selected.days
    ? data.slice(-selected.days)
    : data

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4">
      {/* Header + range toggle */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <span className="text-[13px] font-medium font-inter text-[var(--text)]">
          CTL / ATL / TSB over time
        </span>
        <div className="flex items-center gap-1">
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={[
                'px-2.5 py-1 rounded-full text-[11px] font-inter transition-colors',
                range === r.value
                  ? 'bg-[var(--accent-bg)] text-[var(--accent)]'
                  : 'text-[var(--text3)] hover:bg-[var(--surface2)] hover:text-[var(--text2)]',
              ].join(' ')}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={filtered} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
          <XAxis
            dataKey="date"
            tickFormatter={fmtDate}
            tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--font-inter)' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--font-inter)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => String(Math.round(v))}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-inter)', paddingTop: 8 }}
          />

          {/* TSB zero line */}
          <ReferenceLine y={0} stroke="var(--border2)" strokeDasharray="4 2" />

          {/* Race day vertical markers */}
          {raceDays.map(d => (
            <ReferenceLine
              key={d}
              x={d}
              stroke="var(--race)"
              strokeDasharray="3 3"
              label={{ value: '🏁', position: 'top', fontSize: 10 }}
            />
          ))}

          <Line
            type="monotone"
            dataKey="ctl"
            name="CTL"
            stroke="var(--ctl-color)"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="atl"
            name="ATL"
            stroke="var(--atl-color)"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="tsb"
            name="TSB"
            stroke="var(--tsb-color)"
            dot={false}
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
