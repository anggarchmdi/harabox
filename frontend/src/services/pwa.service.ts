import api from '../lib/api'

// Helper to convert base64 URL to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Singleton AudioContext for instant chime playback without latency
let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

/**
 * Play a crystal-clear, melodic 2-tone chime for incoming orders (D5 -> A5 bell chime)
 */
export function playOrderChime(): void {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    // Tone 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now)

    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(0.4, now + 0.03)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

    osc1.connect(gain1)
    gain1.connect(ctx.destination)

    osc1.start(now)
    osc1.stop(now + 0.5)

    // Tone 2: 880 Hz (A5) - higher cheerful bell tone
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880, now + 0.15)

    gain2.gain.setValueAtTime(0, now + 0.15)
    gain2.gain.linearRampToValueAtTime(0.5, now + 0.18)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9)

    osc2.connect(gain2)
    gain2.connect(ctx.destination)

    osc2.start(now + 0.15)
    osc2.stop(now + 0.9)
  } catch (err) {
    console.warn('Unable to play audio chime:', err)
  }
}

/**
 * Register Service Worker for PWA and Web Push
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })
    return registration
  } catch (err) {
    console.warn('Service Worker registration failed:', err)
    return null
  }
}

/**
 * Check if the browser supports notifications and push
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/**
 * Check current notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied'
  }
  return Notification.permission
}

/**
 * Get active Web Push subscription on the current device
 */
export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null

  try {
    const registration = await navigator.serviceWorker.ready
    return await registration.pushManager.getSubscription()
  } catch {
    return null
  }
}

/**
 * Subscribe current device to Web Push notifications (works even when app is closed)
 */
export async function subscribeToPushNotifications(): Promise<boolean> {
  if (!isPushSupported()) {
    throw new Error('Browser ini tidak mendukung Web Push Notification.')
  }

  // 1. Request permission
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Izin notifikasi belum diberikan oleh browser.')
  }

  // Unlock audio context on user interaction
  getAudioContext()

  // 2. Register service worker if not already
  const registration = await navigator.serviceWorker.ready

  // 3. Fetch VAPID public key from backend
  const { data: vapidRes } = await api.get<{
    success: boolean
    data: { public_key: string }
  }>('/admin/push/vapid-key')

  const publicKey = vapidRes.data?.public_key
  if (!publicKey) {
    throw new Error('VAPID public key tidak tersedia di server.')
  }

  // 4. Subscribe to PushManager
  const convertedVapidKey = urlBase64ToUint8Array(publicKey)
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedVapidKey as unknown as BufferSource,
  })

  // 5. Send subscription to backend
  const subJson = subscription.toJSON()
  await api.post('/admin/push/subscribe', {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subJson.keys?.p256dh,
      auth: subJson.keys?.auth,
    },
    content_encoding: 'aes128gcm',
  })

  return true
}

/**
 * Unsubscribe current device from Web Push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const subscription = await getCurrentPushSubscription()
    if (subscription) {
      const endpoint = subscription.endpoint
      await subscription.unsubscribe()

      try {
        await api.post('/admin/push/unsubscribe', { endpoint })
      } catch {
        // Continue even if backend call fails
      }
    }
    return true
  } catch (err) {
    console.warn('Failed to unsubscribe push:', err)
    return false
  }
}

/**
 * Trigger a test push notification from backend
 */
export async function triggerTestPushNotification(): Promise<{
  success: boolean
  message: string
}> {
  // Also play chime locally for immediate feedback
  playOrderChime()

  const response = await api.post<{
    success: boolean
    message: string
    data?: unknown
  }>('/admin/push/test')

  return response.data
}

/**
 * Show a system OS notification when tab is minimized / backgrounded
 */
export async function showForegroundOrBackgroundNotification(
  title: string,
  options?: NotificationOptions,
): Promise<void> {
  // Always play the melodic chime
  playOrderChime()

  // If Notification API is allowed
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification(title, {
          icon: '/favicon.webp',
          badge: '/favicon.webp',
          ...({ vibrate: [200, 100, 200] } as Record<string, unknown>),
          ...options,
        } as NotificationOptions)
      } else {
        new Notification(title, {
          icon: '/favicon.webp',
          ...options,
        })
      }
    } catch (e) {
      console.warn('Could not display native notification:', e)
    }
  }
}
