interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  unit: string
  trend?: { pct: number } | null
}

function TrendBadge({ pct }: { pct: number }) {
  const positive = pct >= 0
  return (
    <span className={[
      'inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full mt-1.5',
      positive
        ? 'bg-[var(--easy-bg)] text-[var(--easy)]'
        : 'bg-[var(--long-bg)] text-[var(--long)]',
    ].join(' ')}>
      {positive ? '↑' : '↓'} {positive ? '+' : ''}{pct}% vs last week
    </span>
  )
}

export function StatCard({ icon, label, value, unit, trend }: StatCardProps) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4">
      <div className="flex items-center gap-1 text-[var(--text3)] text-[11px] mb-2 font-inter">
        {icon}
        {label}
      </div>
      <div className="text-[var(--text)] text-[22px] font-medium font-mono tracking-tight leading-none">
        {value}
        <span className="text-[var(--text3)] text-[12px] font-normal"> {unit}</span>
      </div>
      {trend !== null && trend !== undefined && <TrendBadge pct={trend.pct} />}
    </div>
  )
}
