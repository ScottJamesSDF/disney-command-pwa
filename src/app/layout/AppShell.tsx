import { Outlet } from 'react-router-dom'
import { NavBar } from './NavBar'
import { OfflineIndicator } from '@/shared/components/OfflineIndicator'

export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2">
          <NavBar />
          <OfflineIndicator />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
