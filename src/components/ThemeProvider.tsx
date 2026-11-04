'use client'

import { createContext, useEffect, useState } from 'react'

export const ThemeContext = createContext<{
  theme: 'light' | 'dark'
  toggleTheme: () => void
}>({
  theme: 'light',
  toggleTheme: () => { },
})

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.dataset.theme = theme
    }
  }, [theme])

  const toggleTheme = () => { setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
