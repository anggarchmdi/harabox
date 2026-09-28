import { useState, useEffect } from 'react'
import {
  Bell,
  BellRing,
  BellOff,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react'
import {
  isPushSupported,
  getNotificationPermission,
  getCurrentPushSubscription,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  triggerTestPushNotification,
  playOrderChime,
} from '../../services/pwa.service'
import { showDynamicIslandToast } from '../ui/AppToaster'

interface NotificationSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  isDark?: boolean
}

export default function NotificationSettingsModal({
  isOpen,
  onClose,
  isDark = true,
}: NotificationSettingsModalProps) {
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isTesting, setIsTesting] = useState<boolean>(false)
  const [supported, setSupported] = useState<boolean>(true)

  const checkStatus = async () => {
    const isSupp = isPushSupported()
    setSupported(isSupp)
    setPermission(getNotificationPermission())

    if (isSupp) {
      const sub = await getCurrentPushSubscription()
      setIsSubscribed(Boolean(sub))
    }
  }

  useEffect(() => {
    if (isOpen) {
      checkStatus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleToggleSubscription = async () => {
    setIsLoading(true)
    try {
      if (isSubscribed) {
        await unsubscribeFromPushNotifications()
        setIsSubscribed(false)
        showDynamicIslandToast({
          title: 'Notifikasi Dinonaktifkan',
          message: 'Anda tidak akan menerima push notification di perangkat ini.',
          type: 'info',
          playChime: false,
        })
      } else {
        await subscribeToPushNotifications()
        setIsSubscribed(true)
        setPermission('granted')
        showDynamicIslandToast({
          title: 'Notifikasi Aktif!',
          message: 'PWA & Web Push siap menerima notifikasi pesanan kapan saja.',
          type: 'order',
          playChime: true,
        })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mengubah status notifikasi.'
      showDynamicIslandToast({
        title: 'Gagal Mengaktifkan',
        message,
        type: 'error',
        playChime: false,
      })
    } finally {
      setIsLoading(false)
      checkStatus()
    }
  }

  const handleTestChimeAndPush = async () => {
    setIsTesting(true)
    try {
      // 1. Play chime immediately
      playOrderChime()

      // 2. Trigger test push notification from backend
      await triggerTestPushNotification()

      // 3. Show Dynamic Island preview
      showDynamicIslandToast({
        title: '🔔 Uji Coba Berhasil!',
        message: 'Suara bel berdering & notifikasi push telah dikirim.',
        type: 'order',
        playChime: false,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mengirim notifikasi uji coba.'
      showDynamicIslandToast({
        title: 'Uji Coba Gagal',
        message,
        type: 'warning',
        playChime: false,
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-md rounded-3xl border shadow-2xl p-6 overflow-hidden transition-all duration-300 ${
          isDark
            ? 'bg-[#180A08] border-[#5E221C] text-stone-100 shadow-black/80'
            : 'bg-white border-stone-200 text-stone-900 shadow-amber-900/10'
        }`}
      >
        {/* Glow decoration */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <BellRing className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Notifikasi Pesanan</h3>
              <p className="text-xs text-amber-300/80">PWA, Web Push & Audio Bel</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Pills */}
        <div className="mt-5 space-y-3">
          <div
            className={`flex items-center justify-between p-3.5 rounded-2xl border ${
              isDark ? 'bg-[#220E0B] border-[#441814]' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Smartphone className="h-4 w-4 text-amber-400" />
              <div>
                <span className="text-xs font-semibold block">Push Notification (Latar Belakang)</span>
                <span className="text-[11px] text-stone-400">
                  {isSubscribed
                    ? 'Aktif (Menerima notif saat app ditutup)'
                    : 'Tidak aktif (Perlu diaktifkan)'}
                </span>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                isSubscribed
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
              }`}
            >
              {isSubscribed ? (
                <>
                  <CheckCircle2 size={12} />
                  <span>Aktif</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={12} />
                  <span>Nonaktif</span>
                </>
              )}
            </span>
          </div>

          <div
            className={`flex items-center justify-between p-3.5 rounded-2xl border ${
              isDark ? 'bg-[#220E0B] border-[#441814]' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Volume2 className="h-4 w-4 text-amber-400" />
              <div>
                <span className="text-xs font-semibold block">Suara Bel & Dynamic Island</span>
                <span className="text-[11px] text-stone-400">Berbunyi saat app dibuka / diminimize</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 size={12} />
              <span>Siap</span>
            </span>
          </div>

          <div
            className={`flex items-center justify-between p-3.5 rounded-2xl border ${
              isDark ? 'bg-[#220E0B] border-[#441814]' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Bell className="h-4 w-4 text-amber-400" />
              <div>
                <span className="text-xs font-semibold block">Izin Browser / OS</span>
                <span className="text-[11px] text-stone-400">
                  {permission === 'granted'
                    ? 'Diizinkan'
                    : permission === 'denied'
                    ? 'Diblokir di pengaturan browser'
                    : 'Belum diminta'}
                </span>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                permission === 'granted'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : permission === 'denied'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
              }`}
            >
              <span>{permission === 'granted' ? 'Diizinkan' : permission === 'denied' ? 'Diblokir' : 'Prompt'}</span>
            </span>
          </div>
        </div>

        {/* Explanation */}
        <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-amber-300">
            <Sparkles size={14} />
            <span>2 Mode Notifikasi Sekaligus:</span>
          </div>
          <p className="text-[11.5px] text-amber-100/90">
            <strong>1. Saat app dibuka / diminimize:</strong> Nada bel berdering merdu + notifikasi Dynamic Island instan di layar.
          </p>
          <p className="text-[11.5px] text-amber-100/90">
            <strong>2. Saat app ditutup sama sekali:</strong> Service Worker Web Push mengirimkan notifikasi OS ke HP/Laptop Anda.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-2.5">
          {!supported ? (
            <div className="p-3 text-center text-xs text-rose-400 bg-rose-950/30 rounded-xl border border-rose-900/50">
              Browser ini belum mendukung Web Push Notification.
            </div>
          ) : (
            <button
              type="button"
              onClick={handleToggleSubscription}
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer shadow-lg active:scale-98 ${
                isSubscribed
                  ? 'bg-rose-950/40 text-rose-300 border border-rose-800/60 hover:bg-rose-900/50'
                  : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-stone-950 hover:from-amber-400 hover:to-yellow-400 shadow-amber-500/20'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Memproses Izin...</span>
                </>
              ) : isSubscribed ? (
                <>
                  <BellOff size={16} />
                  <span>Nonaktifkan Notifikasi Web Push</span>
                </>
              ) : (
                <>
                  <Bell className="fill-stone-950" size={16} />
                  <span>Aktifkan Notifikasi Web Push</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleTestChimeAndPush}
            disabled={isTesting}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl font-medium text-xs transition cursor-pointer border ${
              isDark
                ? 'border-white/10 bg-white/5 text-stone-300 hover:bg-white/10 hover:text-white'
                : 'border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {isTesting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Mengirim Uji Coba...</span>
              </>
            ) : (
              <>
                <Volume2 size={14} className="text-amber-400" />
                <span>Uji Coba Suara Bel & Push Notif</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
