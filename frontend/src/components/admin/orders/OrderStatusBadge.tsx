import type { OrderStatus } from '../../../types/orders'

interface OrderStatusBadgeProps {
  status: OrderStatus
}

const statusConfig: Record<
  OrderStatus,
  {
    label: string
    className: string
  }
> = {
  pending: {
    label: 'Pending',
    className:
      'bg-amber-50 text-amber-700 ring-amber-200',
  },

  confirmed: {
    label: 'Confirmed',
    className:
      'bg-blue-50 text-blue-700 ring-blue-200',
  },

  processing: {
    label: 'Processing',
    className:
      'bg-violet-50 text-violet-700 ring-violet-200',
  },

  completed: {
    label: 'Completed',
    className:
      'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },

  cancelled: {
    label: 'Cancelled',
    className:
      'bg-red-50 text-red-700 ring-red-200',
  },
}

export default function OrderStatusBadge({
  status,
}: OrderStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${config.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {config.label}
    </span>
  )
}
