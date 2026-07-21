'use client'

// Thin wrapper around Capacitor plugins.
// Returns no-ops when running in a regular browser (Capacitor is not loaded).
// Import from here instead of directly from @capacitor/* to avoid SSR crashes.

let _isNative: boolean | null = null

export function isNative(): boolean {
  if (_isNative !== null) return _isNative
  if (typeof window === 'undefined') return (_isNative = false)
  _isNative = !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor?.isNativePlatform?.()
  return _isNative
}

// Light haptic tap — call on like, download, double-tap heart burst.
export async function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (!isNative()) return
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
  await Haptics.impact({
    style: style === 'light' ? ImpactStyle.Light
      : style === 'heavy' ? ImpactStyle.Heavy
      : ImpactStyle.Medium,
  })
}

// Notification vibration (success/error feedback).
export async function hapticNotification(type: 'success' | 'error' | 'warning' = 'success') {
  if (!isNative()) return
  const { Haptics, NotificationType } = await import('@capacitor/haptics')
  await Haptics.notification({
    type: type === 'success' ? NotificationType.Success
      : type === 'error' ? NotificationType.Error
      : NotificationType.Warning,
  })
}

// Native share sheet (falls back to navigator.share on web).
export async function nativeShare(options: { title: string; url: string; text?: string }) {
  if (isNative()) {
    const { Share } = await import('@capacitor/share')
    await Share.share(options)
  } else if (navigator.share) {
    await navigator.share(options)
  } else {
    await navigator.clipboard.writeText(options.url)
  }
}

// Register for push notifications.
// Call this once after the user logs in.
// Returns the FCM/APNs token string, or null if denied/unavailable.
export async function registerPushNotifications(): Promise<string | null> {
  if (!isNative()) return null
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    const result = await PushNotifications.requestPermissions()
    if (result.receive !== 'granted') return null
    await PushNotifications.register()
    return new Promise((resolve) => {
      PushNotifications.addListener('registration', (token) => {
        resolve(token.value)
      })
      PushNotifications.addListener('registrationError', () => {
        resolve(null)
      })
    })
  } catch {
    return null
  }
}
