import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50 px-6">
      {/* Background decoration */}
      <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-red-100" />

      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-red-100" />

      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-100" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-xl text-center">
        {/* 404 */}
        <div className="relative animate-bounce">
          <h1 className="text-[10rem] font-black leading-none tracking-tighter text-red-600 sm:text-[12rem]">
            404
          </h1>
        </div>

        {/* Text */}
        <div className="mt-4">
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Halaman tidak ditemukan
        </h2>

          <p className="mx-auto mt-4 max-w-md text-base leading-7 text-gray-500">
            Sepertinya halaman yang kamu cari sudah dipindahkan,
            dihapus, atau memang tidak pernah ada.
          </p>
        </div>

        {/* Action */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-red-500/20"
          >
            Kembali ke Halaman Utama
          </Link>

          <button
            onClick={() => window.history.back()}
            className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
          >
            Kembali
          </button>
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs text-gray-400">
          HaraBox Admin Dashboard
        </p>
      </div>
    </main>
  )
}
