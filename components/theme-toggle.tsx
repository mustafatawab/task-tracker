'use client'

import { useEffect, useState } from 'react'
import { Monitor, Moon, SunMedium } from 'lucide-react'

const STORAGE_KEY = 'farsight-theme'
const ORDER = ['light', 'dark', 'system'] as const

type Mode = (typeof ORDER)[number]

function resolve(mode: Mode): 'light' | 'dark' {
  if (mode === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  return mode
}

export function applyTheme(mode: Mode) {
  const dark = resolve(mode) === 'dark'
  const root = document.documentElement
  root.classList.toggle('dark', dark)
  root.classList.toggle('light', !dark)
  root.style.colorScheme = dark ? 'dark' : 'light'
}

export function ThemeToggle({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const [mode, setMode] = useState<Mode | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const current: Mode = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
    setMode(current)
    applyTheme(current)
  }, [])

  function cycle() {
    const current: Mode = mode ?? 'system'
    const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]!
    setMode(next)
    localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
  }

  const Icon = mode === 'light' ? SunMedium : mode === 'dark' ? Moon : Monitor
  const activeMode = mode ?? 'system'

  return (
    <button
      type="button"
      onClick={cycle}
      title={`Theme: ${activeMode} — click to switch`}
      aria-label={`Theme is ${activeMode}. Click to switch.`}
      className={className}
    >
      <Icon className="size-4" />
      {showLabel && <span>Theme: {activeMode}</span>}
    </button>
  )
}
