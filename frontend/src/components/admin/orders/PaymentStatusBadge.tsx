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
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-2xs ${
          isDark
            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
            : 'bg-emerald-50 text-emerald-800 border border-emerald-200/90'
        }`}
      >
        <CheckCircle2 size={13} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
        <span>Lunas</span>
        {!compact && paymentMethod && (
          <span
            className={`text-[10px] font-semibold ${
              isDark ? 'text-emerald-300/80' : 'text-emerald-600/80'
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
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-2xs ${
          isDark
            ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
            : 'bg-amber-50 text-amber-800 border border-amber-300/90'
        }`}
      >
        <Coins size={13} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
        <span>DP Masuk</span>
        {!compact && paidAmount && Number(paidAmount) > 0 && (
          <span
            className={`text-[10px] font-mono font-semibold ${
              isDark ? 'text-amber-300' : 'text-amber-700'
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-2xs ${
        isDark
          ? 'bg-[#1C0B09] text-stone-400 border border-[#60241E]'
          : 'bg-stone-100 text-stone-600 border border-stone-200'
      }`}
    >
      <Clock size={13} className={isDark ? 'text-stone-500' : 'text-stone-400'} />
      <span>Belum Bayar</span>
    </span>
  )
}

