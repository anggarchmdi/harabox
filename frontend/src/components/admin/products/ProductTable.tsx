import type { Product } from '../../../types/products'

interface ProductTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export default function ProductTable({
  products,
  onEdit,
  onDelete,
}: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <h3 className="text-lg font-bold text-gray-900">
          Belum ada produk
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Tambahkan produk pertama untuk mulai
          mengelola menu.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                Produk
              </th>

              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                Kategori
              </th>

              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                Harga
              </th>

              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                Status
              </th>

              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr
                key={product.id}
                className="transition hover:bg-gray-50"
              >
                {/* Produk */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="font-bold text-gray-900">
                        {product.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {product.slug}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Kategori */}
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {product.category?.name ?? '-'}
                  </span>
                </td>

                {/* Harga */}
                <td className="px-6 py-4">
                  <span className="font-bold text-gray-900">
                    Rp{' '}
                    {Number(
                      product.price,
                    ).toLocaleString('id-ID')}
                  </span>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                      product.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {product.is_active
                      ? 'Aktif'
                      : 'Nonaktif'}
                  </span>
                </td>

                {/* Aksi */}
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onEdit(product)
                      }
                      className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onDelete(product)
                      }
                      className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
