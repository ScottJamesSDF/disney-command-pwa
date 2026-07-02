import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { DashboardPage } from '@/features/dashboard/DashboardPage'

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [{ index: true, element: <DashboardPage /> }],
  },
])
