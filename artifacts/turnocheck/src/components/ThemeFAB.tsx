import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftRight } from 'lucide-react'
import { useTheme, type Theme } from '@/context/ThemeContext'

export function ThemeFAB() {
  const { theme, toggle, themes } = useTheme()
  const next: Theme = theme === 'kawaii' ? 'spatial' : 'kawaii'

  return (
    <motion.button
      id="theme-fab"
      onClick={toggle}
      aria-label={`Trocar para ${themes[next].label}`}
      title={`Ir para: ${themes[next].label} ${themes[next].emoji}`}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-3
                 bg-white/80 backdrop-blur-md border border-black/10 text-gray-700 shadow-xl
                 outline-none hover:bg-white hover:shadow-2xl
                 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <motion.span
        key={theme}
        initial={{ rotate: -20, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="text-lg leading-none"
      >
        {themes[next].emoji}
      </motion.span>

      <span className="text-xs font-bold tracking-wide uppercase whitespace-nowrap">
        {themes[next].label}
      </span>

      <ArrowLeftRight size={14} className="text-gray-400" />
    </motion.button>
  )
}
