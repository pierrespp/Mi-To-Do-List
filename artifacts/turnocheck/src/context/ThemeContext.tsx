import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'kawaii' | 'spatial'

const STORAGE_KEY = 'mi-todo-theme'
const THEMES: Record<Theme, { label: string; emoji: string }> = {
  kawaii:  { label: 'Kawaii Pride',      emoji: '🌸' },
  spatial: { label: 'Spatial Moodboard', emoji: '📔' },
}

function readTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'kawaii' || v === 'spatial') return v
  } catch { /* ignore */ }
  return 'kawaii'
}

interface ThemeCtx {
  theme: Theme
  toggle: () => void
  themes: typeof THEMES
}

const ThemeContext = createContext<ThemeCtx | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* ignore */ }
  }, [theme])

  const toggle = () => setTheme(prev => (prev === 'kawaii' ? 'spatial' : 'kawaii'))

  return (
    <ThemeContext.Provider value={{ theme, toggle, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
