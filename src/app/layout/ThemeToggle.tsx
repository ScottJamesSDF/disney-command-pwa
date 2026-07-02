import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/app/providers/theme.store'
import { Button } from '@/shared/components/ui/button'

export function ThemeToggle() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode)
  const toggleDarkMode = useThemeStore((state) => state.toggleDarkMode)

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleDarkMode}
    >
      {isDarkMode ? <Sun /> : <Moon />}
    </Button>
  )
}
