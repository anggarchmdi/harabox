import { CheckCircle2, Clock, Coins } from 'lucide-react'
import type { PaymentStatus } from '../../../types/orders'

interface PaymentStatusBadgeProps {
  status?: PaymentStatus | null
  paidAmount?: string | number
  paymentMethod?: string | null
  compact?: boolean
}

function formatRupiahShort(value: string | number) {
  const num = Number(value) || 0
  if (num >= 1000000) {
    return `Rp ${(num / 1000000).toFixed(1).replace('.0', '')}jt`
  }
  if (num >= 1000) {
    return `Rp ${(num / 1000).toFixed(0)}rb`
  }
  return `Rp ${num.toLocaleString('id-ID')}`
}

export default function PaymentStatusBadge({
  status = 'unpaid',
  paidAmount,
  paymentMethod,
  compact = false,
}: PaymentStatusBadgeProps) {
  const effectiveStatus: PaymentStatus = status || 'unpaid'

  if (effectiveStatus === 'paid') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200/90 shadow-2xs">
        <CheckCircle2 size={13} className="text-emerald-600" />
        <span>Lunas</span>
        {!compact && paymentMethod && (
          <span className="text-[10px] font-semibold text-emerald-600/80">
            ({paymentMethod.replace('Transfer ', '')})
          </span>
        )}
      </span>
    )
  }

  if (effectiveStatus === 'dp') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-300/90 shadow-2xs">
        <Coins size={13} className="text-amber-600" />
        <span>DP Masuk</span>
        {!compact && paidAmount && Number(paidAmount) > 0 && (
          <span className="text-[10px] font-mono font-semibold text-amber-700">
            ({formatRupiahShort(paidAmount)})
          </span>
        )}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600 border border-stone-200 shadow-2xs">
      <Clock size={13} className="text-stone-400" />
      <span>Belum Bayar</span>
    </span>
  )
}
