import { Edit, Trash2 } from 'lucide-react'
import type { Product } from '../../../types/products'
import { getImageUrl } from '../../../utils/image'
import { useThemeStore } from '../../../stores/theme.store'

interface ProductTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

function formatRupiah(value: string | number) {
  return `Rp ${Number(value).toLocaleString('id-ID')}`
}

export default function ProductTable({
  products,
  onEdit,
  onDelete,
}: ProductTableProps) {
  const isDark = useThemeStore((state) => state.theme === 'dark')

  if (products.length === 0) {
    return (
      <div className={`rounded-2xl border border-dashed px-6 py-16 text-center ${
        isDark ? 'border-[#60241E] bg-[#240E0C]' : 'border-stone-200 bg-white'
      }`}>
        <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
          Belum ada produk katering
        </h3>
        <p className={`mt-1 text-xs sm:text-sm ${isDark ? 'text-amber-100/70' : 'text-stone-500'}`}>
          Tambahkan produk pertama untuk mulai mengelola katalog menu katering.
        </p>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border shadow-2xs overflow-hidden ${
      isDark ? 'border-[#60241E]/80 bg-[#240E0C]' : 'border-stone-200/90 bg-white'
    }`}>
      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className={`border-b ${
            isDark ? 'border-[#60241E] bg-[#2D120F]' : 'border-stone-100 bg-stone-50/70'
          }`}>
            <tr>
              <th className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'text-amber-100/70' : 'text-stone-400'
              }`}>
                Menu Katering
              </th>
              <th className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'text-amber-100/70' : 'text-stone-400'
              }`}>
                Kategori
              </th>
              <th className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'text-amber-100/70' : 'text-stone-400'
              }`}>
                Harga / Porsi
              </th>
              <th className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'text-amber-100/70' : 'text-stone-400'
              }`}>
                Min. Order
              </th>
              <th className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'text-amber-100/70' : 'text-stone-400'
              }`}>
                Status
              </th>
              <th className={`px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'text-amber-100/70' : 'text-stone-400'
              }`}>
                Aksi
              </th>
            </tr>
          </thead>

          <tbody className={`divide-y text-xs ${isDark ? 'divide-[#60241E]/50' : 'divide-stone-100'}`}>
            {products.map((product) => {
              const imageUrl = getImageUrl(product.image)

              return (
                <tr
                  key={product.id}
                  className={`transition ${isDark ? 'hover:bg-[#2D120F]/60' : 'hover:bg-stone-50/70'}`}
                >
                  {/* Produk */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3.5">
                      <div className={`h-12 w-12 shrink-0 overflow-hidden rounded-xl border ${
                        isDark ? 'bg-[#2D120F] border-[#60241E]' : 'bg-stone-100 border-stone-200/70'
                      }`}>
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className={`flex h-full items-center justify-center text-[10px] font-semibold ${
                            isDark ? 'text-amber-100/40' : 'text-stone-400'
                          }`}>
                            No Photo
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 max-w-xs">
                        <p className={`font-bold truncate ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                          {product.name}
                        </p>
                        <p className={`text-[11px] font-mono truncate ${isDark ? 'text-amber-100/60' : 'text-stone-400'}`}>
                          {product.slug}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Kategori */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${
                      isDark ? 'bg-[#381612] text-amber-200' : 'bg-stone-100 text-stone-700'
                    }`}>
                      {product.category?.name ?? 'Tanpa Kategori'}
                    </span>
                  </td>

                  {/* Harga */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`font-bold font-mono text-xs sm:text-sm ${isDark ? 'text-amber-200' : 'text-stone-950'}`}>
                      {formatRupiah(product.price)}
                    </span>
                  </td>

                  {/* Min Order & Lead Time */}
                  <td className="px-5 py-4 whitespace-nowrap text-xs">
                    <div>
                      <span className={`font-semibold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>{product.minimum_order ?? 10}</span>{' '}
                      <span className={isDark ? 'text-amber-100/70' : 'text-stone-600'}>porsi</span>
                    </div>
                    <div className={`text-[11px] font-medium mt-0.5 ${isDark ? 'text-amber-100/60' : 'text-stone-500'}`}>
                      {product.lead_time_days && product.lead_time_days > 0 ? `Min. H-${product.lead_time_days}` : 'Bisa Hari H'}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        product.is_active
                          ? isDark
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : isDark
                            ? 'bg-stone-800 text-stone-400 border border-stone-700'
                            : 'bg-stone-100 text-stone-500 border border-stone-200'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          product.is_active ? 'bg-emerald-500' : 'bg-stone-400'
                        }`}
                      />
                      {product.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>

                  {/* Aksi */}
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                          isDark
                            ? 'border-[#60241E] bg-[#1C0B09] text-stone-200 hover:bg-[#2D120F]'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <Edit size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(product)}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                          isDark
                            ? 'border-red-900/60 bg-red-950/30 text-red-400 hover:bg-red-950/50'
                            : 'border-red-200 bg-white text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <Trash2 size={13} />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Product Cards (< md) */}
      <div className={`block md:hidden divide-y p-4 space-y-3.5 ${isDark ? 'divide-[#60241E]/50' : 'divide-stone-100'}`}>
        {products.map((product) => {
          const imageUrl = getImageUrl(product.image)

          return (
            <div
              key={product.id}
              className={`rounded-xl border p-3.5 shadow-2xs space-y-3 ${
                isDark ? 'border-[#60241E] bg-[#1C0B09]' : 'border-stone-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border ${
                  isDark ? 'bg-[#2D120F] border-[#60241E]' : 'bg-stone-100 border-stone-200/70'
                }`}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className={`flex h-full items-center justify-center text-[10px] font-semibold ${
                      isDark ? 'text-amber-100/40' : 'text-stone-400'
                    }`}>
                      No Photo
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium truncate ${
                      isDark ? 'bg-[#381612] text-amber-200' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {product.category?.name ?? 'Tanpa Kategori'}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        product.is_active
                          ? isDark
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isDark
                            ? 'bg-stone-800 text-stone-400 border border-stone-700'
                            : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {product.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  <p className={`font-bold text-xs mt-1 truncate ${isDark ? 'text-white' : 'text-stone-900'}`}>
                    {product.name}
                  </p>

                  <div className="flex items-baseline justify-between mt-1">
                    <span className={`font-bold font-mono text-xs ${isDark ? 'text-amber-200' : 'text-stone-950'}`}>
                      {formatRupiah(product.price)}
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-amber-100/60' : 'text-stone-400'}`}>
                      Min. {product.minimum_order ?? 10} porsi • {product.lead_time_days && product.lead_time_days > 0 ? `H-${product.lead_time_days}` : 'Hari H'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`flex items-center justify-end gap-2 pt-2 border-t ${isDark ? 'border-[#60241E]/60' : 'border-stone-100'}`}>
                <button
                  type="button"
                  onClick={() => onEdit(product)}
                  className={`flex-1 inline-flex items-center justify-center gap-1 rounded-lg border py-1.5 text-xs font-semibold transition ${
                    isDark
                      ? 'border-[#60241E] bg-[#240E0C] text-stone-200 hover:bg-[#2D120F]'
                      : 'border-stone-200 bg-white text-stone-700'
                  }`}
                >
                  <Edit size={13} />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(product)}
                  className={`inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    isDark
                      ? 'border-red-900/60 bg-red-950/30 text-red-400 hover:bg-red-950/50'
                      : 'border-red-200 bg-white text-red-600'
                  }`}
                >
                  <Trash2 size={13} />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
