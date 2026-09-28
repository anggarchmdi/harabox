import { Toaster, toast } from 'sonner'
import { Bell, ArrowRight, X, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'
import { playOrderChime } from '../../services/pwa.service'

export interface DynamicIslandToastProps {
  id: string | number
  title: string
  message: string
  type?: 'order' | 'success' | 'info' | 'warning' | 'error'
  actionLabel?: string
  onAction?: () => void
  onDismiss?: () => void
}

export function DynamicIslandContent({
  id,
  title,
  message,
  type = 'order',
  actionLabel,
  onAction,
  onDismiss,
}: DynamicIslandToastProps) {
  const isOrder = type === 'order'

  return (
    <div
      role="alert"
      className="group relative flex items-center gap-3.5 px-4 py-3 min-w-[320px] max-w-[440px] sm:min-w-[380px] rounded-full bg-[#180A08]/95 backdrop-blur-xl border border-amber-500/30 text-white shadow-2xl shadow-black/60 ring-1 ring-white/10 transition-all duration-300 hover:scale-[1.02] hover:border-amber-400/50"
      style={{
        boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.7), 0 0 15px rgba(245, 158, 11, 0.15)',
      }}
    >
      {/* Ambient Pulsing Glow */}
      {isOrder && (
        <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent blur-xs opacity-75 animate-pulse -z-10" />
      )}

      {/* Logo / Icon Badge */}
      <div className="relative shrink-0 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full overflow-hidden border border-amber-500/40 bg-[#250F0D] p-1 shadow-inner flex items-center justify-center">
          {isOrder ? (
            <img
              src="/PawonHara.webp"
              alt="Pawon Hara"
              className="h-full w-full object-contain"
              onError={(e) => {
                // Fallback to Bell if image fails
                ;(e.target as HTMLElement).style.display = 'none'
              }}
            />
          ) : type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : type === 'warning' ? (
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          ) : type === 'error' ? (
            <AlertCircle className="h-5 w-5 text-rose-400" />
          ) : (
            <Bell className="h-5 w-5 text-amber-300" />
          )}
        </div>

        {/* Live Status indicator dot */}
        <span
          className={`absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center`}
        >
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
              isOrder ? 'bg-amber-400' : type === 'success' ? 'bg-emerald-400' : 'bg-red-400'
            }`}
          />
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              isOrder ? 'bg-amber-500' : type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          />
        </span>
      </div>

      {/* Text Info */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-amber-200 tracking-tight truncate">
            {title}
          </span>
          <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 shrink-0">
            {isOrder ? 'Pesanan' : 'Info'}
          </span>
        </div>
        <p className="text-xs text-stone-300 truncate mt-0.5 font-medium leading-relaxed">
          {message}
        </p>
      </div>

      {/* Action / Dismiss Buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={() => {
              onAction()
              toast.dismiss(id)
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 hover:from-amber-400 hover:to-amber-500 transition shadow-xs cursor-pointer active:scale-95"
          >
            <span>{actionLabel}</span>
            <ArrowRight size={12} />
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (onDismiss) onDismiss()
            toast.dismiss(id)
          }}
          aria-label="Tutup notifikasi"
          className="p-1 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

/**
 * Trigger an interactive Dynamic Island Capsule Notification
 */
export function showDynamicIslandToast({
  title,
  message,
  type = 'order',
  actionLabel,
  onAction,
  duration = 6000,
  playChime = true,
}: {
  title: string
  message: string
  type?: 'order' | 'success' | 'info' | 'warning' | 'error'
  actionLabel?: string
  onAction?: () => void
  duration?: number
  playChime?: boolean
}) {
  if (playChime && type === 'order') {
    playOrderChime()
  }

  return toast.custom(
    (id) => (
      <DynamicIslandContent
        id={id}
        title={title}
        message={message}
        type={type}
        actionLabel={actionLabel}
        onAction={onAction}
      />
    ),
    {
      duration,
      position: 'top-center',
    },
  )
}

/**
 * Custom AppToaster component that wraps Sonner with Dynamic Island top-center placement
 */
export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      toastOptions={{
        className:
          '!rounded-full !bg-[#180A08]/95 !backdrop-blur-xl !border !border-amber-500/30 !text-white !shadow-2xl !shadow-black/60 !py-2.5 !px-4 !text-xs !font-medium focus:outline-hidden',
      }}
    />
  )
}
