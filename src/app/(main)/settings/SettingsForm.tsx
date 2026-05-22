'use client'

import { useState, useTransition } from 'react'
import type { Settings } from '@/types/database'
import { IconDeviceFloppy, IconRefresh } from '@tabler/icons-react'

const DISTANCES = [
  { label: 'Marathon',      value: 42195 },
  { label: 'Half marathon', value: 21097 },
  { label: '10K',           value: 10000 },
  { label: '5K',            value: 5000 },
]

interface SettingsFormProps { initial: Settings | null }

type FormState = 'idle' | 'saving' | 'recomputing' | 'done' | 'error'

function paceToStr(s: number | null): string {
  if (!s) return ''
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function strToPaceS(v: string): number | null {
  const parts = v.split(':')
  if (parts.length !== 2) return null
  const m = parseInt(parts[0], 10)
  const s = parseInt(parts[1], 10)
  if (isNaN(m) || isNaN(s)) return null
  return m * 60 + s
}

export function SettingsForm({ initial }: SettingsFormProps) {
  const [form, setForm] = useState({
    race_name:        initial?.race_name        ?? '',
    race_date:        initial?.race_date        ?? '',
    race_distance_m:  initial?.race_distance_m  ?? 42195,
    threshold_hr:     initial?.threshold_hr     ?? '',
    threshold_pace:   paceToStr(initial?.threshold_pace_s ?? null),
    unit_preference:  initial?.unit_preference  ?? 'km',
  })
  const [status, setStatus]   = useState<FormState>('idle')
  const [message, setMessage] = useState('')
  const [, startTransition]   = useTransition()

  function set(key: string, value: string | number) {
    setForm(f => ({ ...f, [key]: value }))
  }

  const origThresholdHr = initial?.threshold_hr

  async function handleSave() {
    setStatus('saving')
    setMessage('')

    try {
      const payload = {
        race_name:       form.race_name   || null,
        race_date:       form.race_date   || null,
        race_distance_m: Number(form.race_distance_m),
        threshold_hr:    form.threshold_hr ? Number(form.threshold_hr) : null,
        threshold_pace_s: strToPaceS(form.threshold_pace),
        unit_preference: form.unit_preference as 'km' | 'mi',
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(await res.text())

      // If threshold_hr changed, re-run training load backfill
      const hrChanged = Number(form.threshold_hr) !== origThresholdHr

      if (hrChanged) {
        setStatus('recomputing')
        setMessage('Recomputing training load with new threshold…')
        startTransition(async () => {
          const bfRes = await fetch('/api/admin/training-load', { method: 'POST' })
          if (!bfRes.ok) {
            setStatus('error')
            setMessage('Settings saved but training load recompute failed.')
          } else {
            setStatus('done')
            setMessage('Settings saved. Training load recomputed.')
          }
        })
      } else {
        setStatus('done')
        setMessage('Settings saved.')
      }
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Save failed.')
    }
  }

  const inputCls = `w-full bg-[var(--surface2)] border border-[var(--border)] rounded-[7px]
    px-3 py-2 text-[13px] font-inter text-[var(--text)] outline-none
    focus:border-[var(--accent)] transition-colors`

  const labelCls = 'block text-[11px] font-inter text-[var(--text3)] mb-1.5'

  return (
    <div className="max-w-lg space-y-6">

      {/* Race */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-5 space-y-4">
        <h2 className="text-[13px] font-medium font-inter text-[var(--text)]">Race goal</h2>

        <div>
          <label className={labelCls}>Race name</label>
          <input
            className={inputCls}
            value={form.race_name}
            onChange={e => set('race_name', e.target.value)}
            placeholder="e.g. Mumbai Marathon 2027"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Race date</label>
            <input
              type="date"
              className={inputCls}
              value={form.race_date}
              onChange={e => set('race_date', e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Distance</label>
            <select
              className={inputCls}
              value={form.race_distance_m}
              onChange={e => set('race_distance_m', Number(e.target.value))}
            >
              {DISTANCES.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Training zones */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-5 space-y-4">
        <h2 className="text-[13px] font-medium font-inter text-[var(--text)]">Training zones</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Threshold HR (bpm)</label>
            <input
              type="number"
              className={inputCls}
              value={form.threshold_hr}
              onChange={e => set('threshold_hr', e.target.value)}
              placeholder="e.g. 168"
            />
            <p className="text-[10px] text-[var(--text3)] font-inter mt-1">
              Used for run classification and TSS.
              {initial?.threshold_hr && ` Current: ${initial.threshold_hr} bpm`}
            </p>
          </div>
          <div>
            <label className={labelCls}>Threshold pace (min/km)</label>
            <input
              type="text"
              className={inputCls}
              value={form.threshold_pace}
              onChange={e => set('threshold_pace', e.target.value)}
              placeholder="e.g. 5:20"
            />
            <p className="text-[10px] text-[var(--text3)] font-inter mt-1">
              Format: min:sec per km
            </p>
          </div>
        </div>

        {Number(form.threshold_hr) !== origThresholdHr && form.threshold_hr && (
          <div className="text-[11px] text-[var(--tempo)] font-inter flex items-center gap-1.5">
            <IconRefresh size={12} />
            Changing threshold HR will recompute training load for all runs.
          </div>
        )}
      </section>

      {/* Units */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-5">
        <h2 className="text-[13px] font-medium font-inter text-[var(--text)] mb-3">Units</h2>
        <div className="flex gap-2">
          {(['km', 'mi'] as const).map(u => (
            <button
              key={u}
              onClick={() => set('unit_preference', u)}
              className={[
                'px-4 py-1.5 rounded-full text-[12px] font-inter transition-colors',
                form.unit_preference === u
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface2)] text-[var(--text2)] hover:bg-[var(--border)]',
              ].join(' ')}
            >
              {u}
            </button>
          ))}
        </div>
      </section>

      {/* Save button + status */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={status === 'saving' || status === 'recomputing'}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white
            rounded-[7px] text-[13px] font-inter transition-colors hover:bg-[var(--accent2)]
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconDeviceFloppy size={15} />
          {status === 'saving'       ? 'Saving…'       :
           status === 'recomputing'  ? 'Recomputing…'  : 'Save changes'}
        </button>

        {message && (
          <span className={`text-[12px] font-inter ${
            status === 'error' ? 'text-[var(--long)]' : 'text-[var(--easy)]'
          }`}>
            {message}
          </span>
        )}
      </div>
    </div>
  )
}
