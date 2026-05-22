'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconRun,
  IconLayoutDashboard,
  IconMap,
  IconChartLine,
  IconRobot,
  IconSettings,
} from '@tabler/icons-react'
import { ThemeToggle } from './ThemeToggle'
import type { Route } from 'next'

const NAV_ITEMS: Array<{ href: Route; icon: React.ElementType; label: string }> = [
  { href: '/dashboard',      icon: IconLayoutDashboard, label: 'Dashboard' },
  { href: '/map',            icon: IconMap,             label: 'Map & hotspots' },
  { href: '/training-load',  icon: IconChartLine,       label: 'Training load' },
  { href: '/ai-insights',    icon: IconRobot,           label: 'AI insights' },
  { href: '/settings',       icon: IconSettings,        label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-[200px] shrink-0 h-screen sticky top-0
      border-r border-[var(--border)] bg-[var(--surface)] px-3 py-5 gap-0.5">

      {/* Logo */}
      <div className="flex items-center gap-2 px-2.5 mb-5">
        <IconRun size={17} className="text-[var(--accent)]" />
        <span className="text-[15px] font-medium font-inter text-[var(--text)] tracking-tight">
          Stride
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center gap-2 px-2.5 py-2 rounded-[7px] text-[12px] font-inter transition-colors',
                active
                  ? 'bg-[var(--accent-bg)] text-[var(--accent)]'
                  : 'text-[var(--text3)] hover:bg-[var(--surface2)] hover:text-[var(--text2)]',
              ].join(' ')}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Theme toggle at bottom */}
      <ThemeToggle />
    </aside>
  )
}

// ─── Mobile bottom tab bar ────────────────────────────────────────────────────

export function BottomTabBar() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50
      bg-[var(--surface)] border-t border-[var(--border)] flex justify-around py-2">
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={[
              'flex flex-col items-center gap-0.5 px-2 py-1 rounded-[6px] text-[10px] font-inter transition-colors',
              active ? 'text-[var(--accent)]' : 'text-[var(--text3)]',
            ].join(' ')}
          >
            <Icon size={19} />
            {label.split(' ')[0]}
          </Link>
        )
      })}
    </nav>
  )
}
