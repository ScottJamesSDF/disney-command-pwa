import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { PlannerPage } from '@/features/planner/PlannerPage'
import { TimelinePage } from '@/features/timeline/TimelinePage'

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'planner', element: <PlannerPage /> },
      { path: 'timeline', element: <TimelinePage /> },
    ],
  },
])
