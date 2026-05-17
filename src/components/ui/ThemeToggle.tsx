'use client'

import { useState, useEffect } from 'react'
import { IconSun, IconMoon } from '@tabler/icons-react'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.getAttribute('data-theme') === 'dark')
  }, [])

  function toggle() {
    const next = dark ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('stride-theme', next)
    setDark(!dark)
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 w-full px-2.5 py-2 rounded-[7px] text-[12px]
        font-jakarta text-[var(--text3)] hover:bg-[var(--surface2)] hover:text-[var(--text2)]
        transition-colors"
    >
      {dark ? <IconSun size={15} /> : <IconMoon size={15} />}
      {dark ? 'Light mode' : 'Dark mode'}
    </button>
  )
}
