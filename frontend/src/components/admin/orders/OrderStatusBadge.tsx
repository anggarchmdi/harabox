import type { OrderStatus } from '../../../types/orders'
import { useThemeStore } from '../../../stores/theme.store'

interface OrderStatusBadgeProps {
  status: OrderStatus
  className?: string
}

const statusConfig: Record<
  OrderStatus,
  {
    label: string
    lightClass: string
    darkClass: string
    dotClass: string
    pulse?: boolean
  }
> = {
  pending: {
    label: 'Menunggu',
    lightClass: 'bg-amber-50 text-amber-800 border-amber-300/90 shadow-2xs',
    darkClass: 'bg-amber-950/40 text-amber-300 border-amber-700/50',
    dotClass: 'bg-amber-500',
    pulse: true,
  },

  confirmed: {
    label: 'Dikonfirmasi',
    lightClass: 'bg-blue-50 text-blue-800 border-blue-300/90 shadow-2xs',
    darkClass: 'bg-blue-950/40 text-blue-300 border-blue-700/50',
    dotClass: 'bg-blue-500',
  },

  processing: {
    label: 'Diproses Dapur',
    lightClass: 'bg-orange-50 text-orange-800 border-orange-300/90 shadow-2xs',
    darkClass: 'bg-orange-950/40 text-orange-300 border-orange-700/50',
    dotClass: 'bg-orange-500',
    pulse: true,
  },

  completed: {
    label: 'Selesai',
    lightClass: 'bg-emerald-50 text-emerald-800 border-emerald-300/90 shadow-2xs',
    darkClass: 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50',
    dotClass: 'bg-emerald-500',
  },

  cancelled: {
    label: 'Dibatalkan',
    lightClass: 'bg-stone-100 text-stone-600 border-stone-300/80',
    darkClass: 'bg-stone-900/60 text-stone-400 border-stone-700/50',
    dotClass: 'bg-stone-400',
  },
}

export default function OrderStatusBadge({
  status,
  className = '',
}: OrderStatusBadgeProps) {
  const isDark = useThemeStore((state) => state.theme === 'dark')
  const config = statusConfig[status] || statusConfig.pending

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border tracking-tight transition-all shrink-0 ${
        isDark ? config.darkClass : config.lightClass
      } ${className}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {config.pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${config.dotClass}`}
          />
        )}
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${config.dotClass}`}
        />
      </span>
      <span>{config.label}</span>
    </span>
  )
}

