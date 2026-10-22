import { useState, useEffect, useRef } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Coins,
  FileText,
  Info,
  Loader2,
  Package,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useThemeStore } from '../../../stores/theme.store'

export interface FieldDiffItem {
  key: string
  label: string
  oldValue: string
  newValue: string
  isCritical?: boolean
  category: 'schedule' | 'customer' | 'delivery' | 'payment' | 'notes'
}

export interface ItemSummaryDetail {
  name: string
  quantity: number
  price: number
  addons: string[]
}

export interface OrderDiffSummary {
  hasChanges: boolean
  criticalCount: number
  fieldDiffs: FieldDiffItem[]
  itemsChanged: boolean
  oldTotalBoxes: number
  newTotalBoxes: number
  oldItems: ItemSummaryDetail[]
  newItems: ItemSummaryDetail[]
  oldTotal: number
  newTotal: number
  diffTotal: number
  oldPaid: number
  newPaid: number
}

interface OrderEditDiffModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  diff: OrderDiffSummary
  orderCode: string
  isSubmitting?: boolean
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

export default function OrderEditDiffModal({
  isOpen,
  onClose,
  onConfirm,
  diff,
  orderCode,
  isSubmitting = false,
}: OrderEditDiffModalProps) {
  const isDark = useThemeStore((state) => state.theme === 'dark')
  const [confirmInput, setConfirmInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const normalizedInput = confirmInput.trim().toUpperCase()
  const isKeywordValid =
    normalizedInput === 'KONFIRMASI' || normalizedInput === 'YAKIN'

  // Reset input and autofocus when modal opens
  useEffect(() => {
    if (isOpen) {
      setConfirmInput('')
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setConfirmInput('')
    }
  }, [isOpen])

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'border-[#60241E] bg-[#1C0B09] text-stone-100'
            : 'border-stone-200 bg-white text-stone-900'
        }`}
      >
        {/* ======================================================== */}
        {/* MODAL HEADER                                             */}
        {/* ======================================================== */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-[#60241E]/80 bg-[#240E0C]' : 'border-stone-200 bg-stone-50/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl ${
                diff.hasChanges
                  ? diff.criticalCount > 0
                    ? isDark
                      ? 'bg-amber-950/70 text-amber-400 border border-amber-600/40'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                    : isDark
                    ? 'bg-blue-950/70 text-blue-400 border border-blue-600/40'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                  : isDark
                  ? 'bg-stone-800 text-stone-300'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {diff.criticalCount > 0 ? (
                <ShieldAlert size={22} className="animate-pulse" />
              ) : diff.hasChanges ? (
                <ShieldCheck size={22} />
              ) : (
                <Info size={22} />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">
                  {diff.hasChanges
                    ? 'Cek Ulang & Konfirmasi Perubahan'
                    : 'Tidak Ada Perubahan Data'}
                </h3>
                <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  {orderCode}
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-amber-200/60' : 'text-stone-500'}`}>
                {diff.hasChanges
                  ? 'Pastikan rincian perubahan di bawah ini sudah akurat sebelum disimpan.'
                  : 'Seluruh formulir masih identik dengan data pesanan yang tersimpan.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isDark
                ? 'text-stone-400 hover:bg-[#2D120F] hover:text-stone-200'
                : 'text-stone-400 hover:bg-stone-200 hover:text-stone-700'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* ======================================================== */}
        {/* MODAL BODY (SCROLLABLE)                                 */}
        {/* ======================================================== */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 scrollbar-thin">
          {/* Critical Warning Banner if Event Date / Time / Portions changed */}
          {diff.criticalCount > 0 && (
            <div
              className={`rounded-2xl border p-4 flex items-start gap-3.5 ${
                isDark
                  ? 'border-amber-600/40 bg-amber-950/40 text-amber-200'
                  : 'border-amber-300 bg-amber-50 text-amber-900'
              }`}
            >
              <AlertTriangle
                size={20}
                className="text-amber-500 shrink-0 mt-0.5"
              />
              <div className="text-xs space-y-1">
                <p className="font-bold">
                  Perhatian: Terdapat perubahan pada data krusial operasional dapur!
                </p>
                <p className={isDark ? 'text-amber-200/80' : 'text-amber-800'}>
                  Perubahan pada <strong>Jadwal Acara (Tanggal / Jam)</strong> atau{' '}
                  <strong>Porsi Katering</strong> akan langsung mempengaruhi jadwal produksi dapur
                  dan kuota harian. Harap konfirmasi dengan teliti.
                </p>
              </div>
            </div>
          )}

          {/* If NO Changes detected */}
          {!diff.hasChanges ? (
            <div
              className={`rounded-2xl border p-8 text-center space-y-3 ${
                isDark
                  ? 'border-[#60241E]/60 bg-[#240E0C]/50 text-stone-300'
                  : 'border-stone-200 bg-stone-50 text-stone-600'
              }`}
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 size={26} />
              </div>
              <h4 className="text-sm font-bold">Data Masih Sama</h4>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                Anda belum melakukan perubahan apapun pada pesanan ini. Anda dapat menutup jendela ini
                dan kembali ke halaman daftar pesanan.
              </p>
            </div>
          ) : (
            <>
              {/* Summary Badges Count */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 ${
                    isDark
                      ? 'bg-amber-950/60 text-amber-300 border border-amber-600/30'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  <FileText size={13} />
                  <span>
                    {diff.fieldDiffs.length + (diff.itemsChanged ? 1 : 0)} Bagian Diubah
                  </span>
                </span>

                {diff.itemsChanged && (
                  <span
                    className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 ${
                      diff.newTotalBoxes !== diff.oldTotalBoxes
                        ? isDark
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-600/30'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                        : isDark
                        ? 'bg-stone-800 text-stone-300'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    <Package size={13} />
                    <span>
                      Porsi:{' '}
                      <strong>{diff.oldTotalBoxes}</strong>
                      <ArrowRight size={11} className="inline mx-1" />
                      <strong>{diff.newTotalBoxes} Box</strong>
                      {diff.newTotalBoxes !== diff.oldTotalBoxes && (
                        <span className="ml-1 text-[11px] opacity-80">
                          (
                          {diff.newTotalBoxes > diff.oldTotalBoxes
                            ? `+${diff.newTotalBoxes - diff.oldTotalBoxes}`
                            : `${diff.newTotalBoxes - diff.oldTotalBoxes}`}
                          )
                        </span>
                      )}
                    </span>
                  </span>
                )}

                {diff.diffTotal !== 0 && (
                  <span
                    className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 ${
                      diff.diffTotal > 0
                        ? isDark
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-600/30'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : isDark
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-600/30'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    <Coins size={13} />
                    <span>
                      Tagihan:{' '}
                      {diff.diffTotal > 0
                        ? `+${formatRupiah(diff.diffTotal)}`
                        : `${formatRupiah(diff.diffTotal)}`}
                    </span>
                  </span>
                )}
              </div>

              {/* ==================================================== */}
              {/* FIELD DIFF LIST                                      */}
              {/* ==================================================== */}
              {diff.fieldDiffs.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Rincian Informasi yang Diubah
                  </h4>

                  <div className="space-y-2">
                    {diff.fieldDiffs.map((field) => (
                      <div
                        key={field.key}
                        className={`rounded-2xl border p-3 text-xs transition ${
                          field.isCritical
                            ? isDark
                              ? 'border-amber-600/50 bg-amber-950/20'
                              : 'border-amber-300 bg-amber-50/50'
                            : isDark
                            ? 'border-[#60241E]/60 bg-[#240E0C]/40'
                            : 'border-stone-200 bg-stone-50/70'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-stone-200/40 dark:border-[#60241E]/40">
                          <span className="font-bold flex items-center gap-1.5">
                            {field.isCritical && (
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            )}
                            {field.label}
                          </span>
                          {field.isCritical && (
                            <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                              Krusial
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                          {/* SEBELUM */}
                          <div
                            className={`rounded-xl p-2.5 border ${
                              isDark
                                ? 'border-red-950/40 bg-red-950/20 text-stone-300'
                                : 'border-red-200 bg-red-50/60 text-stone-600'
                            }`}
                          >
                            <span className="block text-[10px] uppercase font-bold text-red-500/80 mb-1">
                              Sebelum:
                            </span>
                            <span className="font-medium line-through decoration-red-500/60 break-words">
                              {field.oldValue || '(Kosong)'}
                            </span>
                          </div>

                          {/* SESUDAH */}
                          <div
                            className={`rounded-xl p-2.5 border ${
                              isDark
                                ? 'border-emerald-950/40 bg-emerald-950/20 text-emerald-200'
                                : 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
                            }`}
                          >
                            <span className="block text-[10px] uppercase font-bold text-emerald-600 mb-1">
                              Sesudah (Perubahan):
                            </span>
                            <span className="font-bold break-words">{field.newValue}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* ITEM / MENU DIFF (IF CHANGED)                        */}
              {/* ==================================================== */}
              {diff.itemsChanged && (
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Rincian Menu & Add-on Pesanan
                  </h4>

                  <div
                    className={`rounded-2xl border p-3.5 space-y-3 ${
                      isDark ? 'border-[#60241E]/70 bg-[#240E0C]/40' : 'border-stone-200 bg-stone-50/70'
                    }`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Old Items List */}
                      <div
                        className={`rounded-xl border p-3 ${
                          isDark ? 'border-red-950/40 bg-red-950/10' : 'border-red-200 bg-red-50/40'
                        }`}
                      >
                        <span className="block text-[10px] uppercase font-bold text-red-500 mb-2">
                          Daftar Menu Sebelumnya ({diff.oldTotalBoxes} Porsi):
                        </span>
                        <div className="space-y-1.5">
                          {diff.oldItems.map((it, idx) => (
                            <div
                              key={idx}
                              className="flex items-start justify-between gap-2 pb-1 border-b border-red-200/30 dark:border-red-900/30 last:border-none last:pb-0"
                            >
                              <div>
                                <span className="font-medium text-stone-300 dark:text-stone-300">
                                  {it.name}
                                </span>
                                {it.addons.length > 0 && (
                                  <span className="block text-[10px] text-stone-400">
                                    + {it.addons.join(', ')}
                                  </span>
                                )}
                              </div>
                              <span className="font-bold text-stone-400 shrink-0">
                                {it.quantity}x
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* New Items List */}
                      <div
                        className={`rounded-xl border p-3 ${
                          isDark
                            ? 'border-emerald-950/40 bg-emerald-950/20'
                            : 'border-emerald-200 bg-emerald-50/70'
                        }`}
                      >
                        <span className="block text-[10px] uppercase font-bold text-emerald-600 mb-2">
                          Daftar Menu Baru ({diff.newTotalBoxes} Porsi):
                        </span>
                        <div className="space-y-1.5">
                          {diff.newItems.map((it, idx) => (
                            <div
                              key={idx}
                              className="flex items-start justify-between gap-2 pb-1 border-b border-emerald-200/40 dark:border-emerald-900/40 last:border-none last:pb-0"
                            >
                              <div>
                                <span className="font-bold text-emerald-900 dark:text-emerald-200">
                                  {it.name}
                                </span>
                                {it.addons.length > 0 && (
                                  <span className="block text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
                                    + {it.addons.join(', ')}
                                  </span>
                                )}
                              </div>
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                                {it.quantity}x
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* FINANCIAL TOTAL SUMMARY                              */}
              {/* ==================================================== */}
              <div
                className={`rounded-2xl border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDark ? 'border-[#60241E] bg-[#1C0B09]' : 'border-stone-200 bg-stone-100/60'
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    Perubahan Total Tagihan
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-stone-400 line-through">
                      {formatRupiah(diff.oldTotal)}
                    </span>
                    <ArrowRight size={13} className="text-stone-400" />
                    <span className="text-sm font-black text-amber-500">
                      {formatRupiah(diff.newTotal)}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    Selisih Tagihan
                  </span>
                  <span
                    className={`text-sm font-black ${
                      diff.diffTotal > 0
                        ? 'text-emerald-500'
                        : diff.diffTotal < 0
                        ? 'text-rose-500'
                        : 'text-stone-400'
                    }`}
                  >
                    {diff.diffTotal > 0
                      ? `+${formatRupiah(diff.diffTotal)} (Bertambah)`
                      : diff.diffTotal < 0
                      ? `${formatRupiah(diff.diffTotal)} (Berkurang)`
                      : 'Rp 0 (Tetap)'}
                  </span>
                </div>
              </div>

              {/* ==================================================== */}
              {/* KEYWORD CONFIRMATION INPUT                           */}
              {/* ==================================================== */}
              <div
                className={`rounded-2xl border p-4 space-y-2.5 ${
                  isDark
                    ? 'border-[#60241E] bg-[#240E0C]/70'
                    : 'border-stone-200 bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="confirm-keyword-input"
                    className="text-xs font-bold flex items-center gap-1.5"
                  >
                    <ShieldCheck size={14} className="text-amber-500" />
                    <span>Verifikasi Konfirmasi Admin:</span>
                  </label>
                  {isKeywordValid ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500">
                      <Check size={13} />
                      <span>Kata kunci cocok</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-400">
                      Wajib diketik untuk menyimpan
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    ref={inputRef}
                    id="confirm-keyword-input"
                    type="text"
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    placeholder="Ketik 'KONFIRMASI' atau 'YAKIN'"
                    autoComplete="off"
                    disabled={isSubmitting}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold uppercase tracking-wider transition outline-none ${
                      isKeywordValid
                        ? 'border-emerald-500/80 bg-emerald-500/10 text-emerald-500 focus:ring-2 focus:ring-emerald-500/30'
                        : isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                        : 'border-stone-300 bg-white text-stone-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                    }`}
                  />
                  {isKeywordValid && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-stone-400">
                  Ketik kata <strong className="text-amber-500">KONFIRMASI</strong> atau{' '}
                  <strong className="text-amber-500">YAKIN</strong> untuk membuka tombol simpan.
                </p>
              </div>
            </>
          )}
        </div>

        {/* ======================================================== */}
        {/* MODAL FOOTER ACTIONS                                    */}
        {/* ======================================================== */}
        <div
          className={`px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
            isDark ? 'border-[#60241E]/80 bg-[#240E0C]' : 'border-stone-200 bg-stone-50/80'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              isDark
                ? 'border-[#60241E] bg-[#1C0B09] text-stone-300 hover:bg-[#2D120F]'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
            }`}
          >
            {diff.hasChanges ? 'Periksa Kembali (Batal)' : 'Tutup'}
          </button>

          {diff.hasChanges && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={!isKeywordValid || isSubmitting}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                isKeywordValid && !isSubmitting
                  ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white shadow-red-950/20 active:scale-95'
                  : 'bg-stone-300 dark:bg-stone-800 text-stone-500 dark:text-stone-400 opacity-60 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Menyimpan Perubahan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Ya, Simpan Perubahan Pesanan</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
