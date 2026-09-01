export default function AdminDashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Heading */}
      <div>
        <p className="text-sm font-medium text-red-600">
          Overview
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Selamat datang kembali. Berikut ringkasan HaraBox hari ini.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Orders"
          value="128"
          description="Pesanan bulan ini"
        />

        <StatCard
          title="Products"
          value="24"
          description="Produk tersedia"
        />

        <StatCard
          title="Categories"
          value="8"
          description="Kategori aktif"
        />

        <StatCard
          title="Revenue"
          value="Rp 12.8M"
          description="Pendapatan bulan ini"
        />
      </div>

      {/* Content */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Recent Orders */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white xl:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div>
              <h2 className="font-semibold text-gray-900">
                Pesanan Terbaru
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Pesanan yang baru masuk
              </p>
            </div>

            <button className="text-sm font-medium text-red-600 hover:text-red-700">
              Lihat semua
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-400">
                <tr>
                  <th className="px-6 py-4 font-medium">
                    Order
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Customer
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right font-medium">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                <OrderRow
                  order="#HB-00128"
                  customer="Budi Santoso"
                  status="Selesai"
                  total="Rp 450.000"
                />

                <OrderRow
                  order="#HB-00127"
                  customer="Andi Wijaya"
                  status="Diproses"
                  total="Rp 275.000"
                />

                <OrderRow
                  order="#HB-00126"
                  customer="Siti Aminah"
                  status="Pending"
                  total="Rp 625.000"
                />

                <OrderRow
                  order="#HB-00125"
                  customer="Dimas Pratama"
                  status="Selesai"
                  total="Rp 350.000"
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Info */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900">
            Quick Overview
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Status sistem hari ini
          </p>

          <div className="mt-6 space-y-5">
            <ProgressItem
              label="Orders"
              value="128"
              progress="75%"
            />

            <ProgressItem
              label="Products"
              value="24"
              progress="60%"
            />

            <ProgressItem
              label="Categories"
              value="8"
              progress="40%"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, description }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-red-200 hover:shadow-sm">
      <p className="text-sm font-medium text-gray-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-gray-400">
        {description}
      </p>
    </div>
  )
}

function OrderRow({
  order,
  customer,
  status,
  total,
}) {
  const statusClass = {
    Selesai: 'bg-green-50 text-green-600',
    Diproses: 'bg-blue-50 text-blue-600',
    Pending: 'bg-yellow-50 text-yellow-600',
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
        {order}
      </td>

      <td className="whitespace-nowrap px-6 py-4 text-gray-500">
        {customer}
      </td>

      <td className="px-6 py-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass[status]}`}
        >
          {status}
        </span>
      </td>

      <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-gray-900">
        {total}
      </td>
    </tr>
  )
}

function ProgressItem({ label, value, progress }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">
          {label}
        </span>

        <span className="text-gray-400">
          {value}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-red-500"
          style={{ width: progress }}
        />
      </div>
    </div>
  )
}
