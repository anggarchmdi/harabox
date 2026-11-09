import { CheckCircle2, Clock, Coins } from 'lucide-react'
import type { PaymentStatus } from '../../../types/orders'
import { useThemeStore } from '../../../stores/theme.store'

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
  const isDark = useThemeStore((state) => state.theme === 'dark')
  const effectiveStatus: PaymentStatus = status || 'unpaid'

  if (effectiveStatus === 'paid') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border shadow-2xs transition-all shrink-0 ${
          isDark
            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50'
            : 'bg-emerald-50 text-emerald-800 border-emerald-300/80'
        }`}
      >
        <CheckCircle2 size={12} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
        <span>Lunas</span>
        {!compact && paymentMethod && (
          <span
            className={`text-[10px] font-normal ${
              isDark ? 'text-emerald-300/80' : 'text-emerald-700/80'
            }`}
          >
            ({paymentMethod.replace('Transfer ', '')})
          </span>
        )}
      </span>
    )
  }

  if (effectiveStatus === 'dp') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border shadow-2xs transition-all shrink-0 ${
          isDark
            ? 'bg-amber-950/40 text-amber-300 border-amber-700/50'
            : 'bg-amber-50 text-amber-800 border-amber-300/80'
        }`}
      >
        <Coins size={12} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
        <span>DP Masuk</span>
        {!compact && paidAmount && Number(paidAmount) > 0 && (
          <span
            className={`text-[10px] font-mono font-normal ${
              isDark ? 'text-amber-300/90' : 'text-amber-800/90'
            }`}
          >
            ({formatRupiahShort(paidAmount)})
          </span>
        )}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border shadow-2xs transition-all shrink-0 ${
        isDark
          ? 'bg-stone-900/60 text-stone-400 border-stone-800'
          : 'bg-stone-100/90 text-stone-600 border-stone-200'
      }`}
    >
      <Clock size={12} className={isDark ? 'text-stone-500' : 'text-stone-400'} />
      <span>Belum Bayar</span>
    </span>
  )
}

