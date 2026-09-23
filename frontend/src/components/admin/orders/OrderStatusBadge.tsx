import type { OrderStatus } from '../../../types/orders'
import { useThemeStore } from '../../../stores/theme.store'

interface OrderStatusBadgeProps {
  status: OrderStatus
}

const statusConfig: Record<
  OrderStatus,
  {
    label: string
    lightClass: string
    darkClass: string
  }
> = {
  pending: {
    label: 'Pending',
    lightClass: 'bg-amber-50 text-amber-700 ring-amber-200',
    darkClass: 'bg-amber-950/60 text-amber-400 ring-amber-700/60',
  },

  confirmed: {
    label: 'Confirmed',
    lightClass: 'bg-blue-50 text-blue-700 ring-blue-200',
    darkClass: 'bg-blue-950/60 text-blue-400 ring-blue-700/60',
  },

  processing: {
    label: 'Processing',
    lightClass: 'bg-violet-50 text-violet-700 ring-violet-200',
    darkClass: 'bg-violet-950/60 text-violet-400 ring-violet-700/60',
  },

  completed: {
    label: 'Completed',
    lightClass: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    darkClass: 'bg-emerald-950/60 text-emerald-400 ring-emerald-700/60',
  },

  cancelled: {
    label: 'Cancelled',
    lightClass: 'bg-red-50 text-red-700 ring-red-200',
    darkClass: 'bg-red-950/60 text-red-400 ring-red-700/60',
  },
}

export default function OrderStatusBadge({
  status,
}: OrderStatusBadgeProps) {
  const isDark = useThemeStore((state) => state.theme === 'dark')
  const config = statusConfig[status] || statusConfig.pending

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${
        isDark ? config.darkClass : config.lightClass
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {config.label}
    </span>
  )
}

