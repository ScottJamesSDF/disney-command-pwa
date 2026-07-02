import { useEffect, type ReactNode } from 'react'
import { useThemeStore } from './theme.store'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const isDarkMode = useThemeStore((state) => state.isDarkMode)

  useEffect(() => {
    document.documentElement.classList.toggle('light', !isDarkMode)
  }, [isDarkMode])

  return children
}
