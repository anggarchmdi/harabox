import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useThemeStore } from '../../stores/theme.store'

export interface PaginationProps {
  /** Halaman aktif saat ini (1-indexed) */
  currentPage: number
  /** Jumlah total halaman */
  lastPage: number
  /** Jumlah total item/data */
  total: number
  /** Callback saat nomor halaman diklik */
  onPageChange: (page: number) => void
  /** Label nama entitas data (contoh: "pesanan", "produk", "kategori", "testimoni") */
  itemName?: string
  /** ClassName tambahan untuk container */
  className?: string
  /** Override tema gelap (jika tidak diisi, otomatis mengikuti tema dari useThemeStore) */
  isDark?: boolean
  /** Menonaktifkan tombol navigasi (misal saat sedang fetching data) */
  disabled?: boolean
  /** Apakah tetap menampilkan footer pagination jika hanya ada 1 halaman (default: false) */
  showWhenSinglePage?: boolean
}

/**
 * Komponen Pagination terstandar untuk panel Admin HaraBox.
 * Mengikuti desain dan behavior pagination di Admin Rekap Pesanan.
 */
export default function Pagination({
  currentPage,
  lastPage,
  total,
  onPageChange,
  itemName = 'data',
  className = '',
  isDark: explicitIsDark,
  disabled = false,
  showWhenSinglePage = false,
}: PaginationProps) {
  const storeIsDark = useThemeStore((s) => s.theme === 'dark')
  const isDark = explicitIsDark ?? storeIsDark

  if (!showWhenSinglePage && lastPage <= 1) {
    return null
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-3 text-xs ${
        isDark ? 'border-[#60241E] bg-[#1C0B09]' : 'border-stone-200 bg-stone-50/50'
      } ${className}`}
    >
      <p className={isDark ? 'text-stone-400' : 'text-stone-500'}>
        Menampilkan halaman{' '}
        <span className="font-bold text-red-600">{currentPage}</span> dari{' '}
        <span className="font-bold">{lastPage}</span> ({total} {itemName})
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1 || disabled}
          className={`p-2 rounded-lg border transition disabled:opacity-30 cursor-pointer ${
            isDark
              ? 'border-[#60241E] bg-[#240E0C] text-stone-200 hover:bg-[#2D120F]'
              : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
          }`}
          aria-label="Halaman Sebelumnya"
        >
          <ChevronLeft size={14} />
        </button>

        {Array.from({ length: lastPage }).map((_, i) => {
          const pageNum = i + 1
          if (
            pageNum === 1 ||
            pageNum === lastPage ||
            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
          ) {
            return (
              <button
                key={pageNum}
                type="button"
                disabled={disabled}
                onClick={() => onPageChange(pageNum)}
                className={`h-8 w-8 rounded-lg text-xs font-bold transition cursor-pointer disabled:cursor-not-allowed ${
                  currentPage === pageNum
                    ? 'bg-red-600 text-white'
                    : isDark
                      ? 'border border-[#60241E] bg-[#240E0C] text-stone-300 hover:bg-[#2D120F]'
                      : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                {pageNum}
              </button>
            )
          } else if (
            pageNum === currentPage - 2 ||
            pageNum === currentPage + 2
          ) {
            return (
              <span key={pageNum} className="px-1 text-stone-400 select-none">
                ...
              </span>
            )
          }
          return null
        })}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(lastPage, currentPage + 1))}
          disabled={currentPage >= lastPage || disabled}
          className={`p-2 rounded-lg border transition disabled:opacity-30 cursor-pointer ${
            isDark
              ? 'border-[#60241E] bg-[#240E0C] text-stone-200 hover:bg-[#2D120F]'
              : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
          }`}
          aria-label="Halaman Selanjutnya"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
