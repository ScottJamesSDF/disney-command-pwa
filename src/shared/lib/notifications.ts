/**
 * Thin wrapper around the standard Notification API. Phase 1 has no backend
 * to push from, so these are real, client-triggered local notifications
 * (fired when engine-derived state crosses a threshold) rather than
 * placeholder server Web Push — see docs/ARCHITECTURE.md for the Phase 2+
 * plan to add true server-initiated push once Supabase exists to send from.
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied'
  if (Notification.permission !== 'default') return Notification.permission
  return Notification.requestPermission()
}

export async function notify(title: string, options?: NotificationOptions): Promise<void> {
  if (!isNotificationSupported()) return
  const permission = await ensureNotificationPermission()
  if (permission !== 'granted') return

  const registration = await navigator.serviceWorker?.getRegistration()
  if (registration) {
    await registration.showNotification(title, options)
  } else {
    new Notification(title, options)
  }
}
