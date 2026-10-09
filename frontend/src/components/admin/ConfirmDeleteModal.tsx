import React, { useState, useEffect, useRef } from 'react'
import { AlertTriangle, Trash2, X, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react'
import { useThemeStore } from '../../stores/theme.store'

export interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  title?: string
  itemName: string
  itemType?: string // e.g. "produk", "kategori"
  expectedConfirmation?: string // defaults to `Hapus ${itemName}`
  description?: React.ReactNode
  warningDetails?: React.ReactNode
  isLoading?: boolean
  confirmButtonText?: string
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType = 'item',
  expectedConfirmation,
  description,
  warningDetails,
  isLoading = false,
  confirmButtonText,
}: ConfirmDeleteModalProps) {
  const isDark = useThemeStore((state) => state.theme === 'dark')
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const trimmedItemName = itemName.trim()
  const expectedKeyword = expectedConfirmation ?? `Hapus ${trimmedItemName}`
  const isMatched = inputValue.trim() === expectedKeyword
  const isCaseMismatch =
    !isMatched &&
    inputValue.trim().toLowerCase() === expectedKeyword.toLowerCase()

  // Reset input and autofocus when modal opens
  useEffect(() => {
    if (isOpen) {
      setInputValue('')
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 60)
      return () => clearTimeout(timer)
    } else {
      setInputValue('')
    }
  }, [isOpen, itemName])

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isLoading, onClose])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isMatched || isLoading) return
    onConfirm()
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose()
    }
  }

  const modalTitle = title ?? `Hapus ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}?`
  const defaultButtonText = confirmButtonText ?? `Ya, Hapus ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className={`relative w-full max-w-md rounded-3xl border shadow-2xl p-6 overflow-hidden transition-all duration-300 ${
          isDark
            ? 'bg-[#180A08] border-[#5E221C] text-stone-100 shadow-black/80'
            : 'bg-white border-stone-200 text-stone-900 shadow-stone-900/15'
        }`}
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-red-600/15 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-red-500 border border-red-500/25 shadow-xs">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">{modalTitle}</h3>
              <p className={`text-xs ${isDark ? 'text-red-400/90' : 'text-red-600'}`}>
                Tindakan permanen & tidak dapat dibatalkan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={`rounded-full p-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isDark ? 'text-stone-400 hover:text-white hover:bg-white/10' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
            }`}
            title="Tutup dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content & Description */}
        <div className="mt-4 space-y-3.5">
          {description ? (
            <div className={`text-xs sm:text-sm ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
              {description}
            </div>
          ) : (
            <p className={`text-xs sm:text-sm ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
              Apakah Anda yakin ingin menghapus {itemType}{' '}
              <strong className={isDark ? 'text-white' : 'text-stone-900'}>
                "{trimmedItemName}"
              </strong>
              ? Data ini akan dihapus secara permanen dari sistem.
            </p>
          )}

          {warningDetails && (
            <div className={`p-3 rounded-xl border text-xs ${
              isDark ? 'bg-amber-950/30 border-amber-800/50 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <div className="flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-500" />
                <div>{warningDetails}</div>
              </div>
            </div>
          )}

          {/* Typing confirmation security instruction */}
          <form onSubmit={handleSubmit} className="space-y-2.5 pt-1">
            <div className={`rounded-2xl border p-3.5 space-y-2 ${
              isDark ? 'bg-[#220E0B] border-[#441814]' : 'bg-stone-50 border-stone-200'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                  Untuk konfirmasi, ketik teks berikut:
                </span>
              </div>

              {/* Exact required phrase pill */}
              <div className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                isDark ? 'bg-[#180A08] border-[#5E221C]' : 'bg-white border-stone-200'
              }`}>
                <code className="text-xs sm:text-sm font-mono font-bold text-red-500 select-all tracking-wide">
                  {expectedKeyword}
                </code>
              </div>

              {/* Input field */}
              <div className="pt-1 space-y-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`Ketik "${expectedKeyword}"`}
                  disabled={isLoading}
                  autoComplete="off"
                  spellCheck="false"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm outline-none transition disabled:opacity-50 ${
                    isMatched
                      ? isDark
                        ? 'border-emerald-500/70 bg-emerald-950/20 text-white ring-1 ring-emerald-500/50'
                        : 'border-emerald-500 bg-emerald-50/50 text-stone-900 ring-1 ring-emerald-500/50'
                      : isDark
                        ? 'border-[#5E221C] bg-[#180A08] text-white placeholder-stone-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
                        : 'border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
                  }`}
                />

                {/* Status indicator hint */}
                <div className="flex items-center gap-1.5 text-[11px] min-h-[18px]">
                  {isMatched ? (
                    <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
                      <CheckCircle2 size={13} />
                      Konfirmasi sesuai. Tombol hapus telah aktif.
                    </span>
                  ) : isCaseMismatch ? (
                    <span className="text-amber-500 font-medium">
                      Perhatikan huruf besar/kecil (case-sensitive).
                    </span>
                  ) : inputValue.length > 0 ? (
                    <span className={isDark ? 'text-stone-400' : 'text-stone-500'}>
                      Ketik teks persis sama seperti di atas untuk melanjutkan.
                    </span>
                  ) : (
                    <span className={isDark ? 'text-stone-500' : 'text-stone-400'}>
                      Ketik ketikan di atas untuk mengaktifkan tombol hapus.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-5 flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className={`rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-semibold transition disabled:opacity-50 cursor-pointer ${
                  isDark
                    ? 'border-[#5E221C] bg-[#180A08] text-stone-300 hover:bg-[#25100D] hover:text-white'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                }`}
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={!isMatched || isLoading}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition ${
                  isMatched && !isLoading
                    ? 'bg-red-600 hover:bg-red-700 hover:shadow-red-900/30 cursor-pointer active:scale-[0.98]'
                    : 'bg-red-900/40 text-stone-400 border border-red-900/40 cursor-not-allowed opacity-50'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    <span>{defaultButtonText}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
