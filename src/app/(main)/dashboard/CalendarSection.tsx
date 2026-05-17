'use client'

import { useState, useCallback } from 'react'
import { TrainingCalendar } from '@/components/calendar/TrainingCalendar'
import { RunDetailPanel } from '@/components/calendar/RunDetailPanel'
import type { Run, RunWithWeather, RunWithLaps } from '@/types/database'

interface CalendarSectionProps { runs: Run[] }

type DetailRun = RunWithWeather & RunWithLaps

export function CalendarSection({ runs }: CalendarSectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail,     setDetail]     = useState<DetailRun | null>(null)
  const [loading,    setLoading]    = useState(false)

  const handleSelect = useCallback(async (run: Run) => {
    if (run.id === selectedId) {
      setSelectedId(null)
      setDetail(null)
      return
    }
    setSelectedId(run.id)
    setDetail(null)
    setLoading(true)
    try {
      const res  = await fetch(`/api/runs/${run.id}`)
      const data = await res.json() as DetailRun
      setDetail(data)
    } finally {
      setLoading(false)
    }
  }, [selectedId])

  const handleClose = useCallback(() => {
    setSelectedId(null)
    setDetail(null)
  }, [])

  return (
    <div className="flex flex-col md:flex-row gap-4 items-start">
      <div className="flex-1 min-w-0">
        <TrainingCalendar
          runs={runs}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>
      {(loading || detail) && (
        <RunDetailPanel run={detail} loading={loading} onClose={handleClose} />
      )}
    </div>
  )
}
