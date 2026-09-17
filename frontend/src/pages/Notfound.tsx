import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#1C0B09] text-stone-100 px-6 selection:bg-[#F59E0B] selection:text-[#1C0B09]">
      {/* Background decoration */}
      <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#60241E]/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#F59E0B]/15 blur-3xl pointer-events-none" />
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#60241E]/40 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-xl text-center">
        {/* Monogram Badge */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#60241E] via-[#95271D] to-[#E77B49] text-white shadow-xl ring-2 ring-[#F59E0B]/40">
          <span className="font-dhaksinarga text-xl font-bold tracking-wider text-amber-300">PH</span>
        </div>

        {/* 404 */}
        <div className="relative">
          <h1 className="font-dhaksinarga text-[7rem] sm:text-[10rem] font-black leading-none tracking-wider text-transparent bg-gradient-to-b from-[#F59E0B] via-[#E77B49] to-[#95271D] bg-clip-text drop-shadow-md">
            404
          </h1>
        </div>

        {/* Text */}
        <div className="mt-2">
          <h2 className="font-dhaksinarga text-2xl sm:text-3xl font-bold tracking-wide text-white">
            Halaman Tidak Ditemukan
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm sm:text-base leading-relaxed text-amber-100/75">
            Sepertinya tautan hidangan katering atau halaman yang Anda tuju sudah berpindah atau belum tersedia di Pawon Hara.
          </p>
        </div>

        {/* Action */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="rounded-xl bg-gradient-to-r from-[#F59E0B] via-[#E77B49] to-[#F59E0B] px-6 py-3 text-sm font-dhaksinarga tracking-wide font-black text-[#1C0B09] shadow-lg shadow-[#F59E0B]/20 transition duration-300 hover:brightness-110 active:scale-98"
          >
            Kembali ke Beranda Utama
          </Link>

          <button
            onClick={() => window.history.back()}
            className="rounded-xl border border-[#60241E] bg-[#2D120F] px-6 py-3 text-sm font-semibold text-amber-200 transition hover:bg-[#3B1814] hover:text-white cursor-pointer"
          >
            Kembali ke Halaman Sebelumnya
          </button>
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs font-dhaksinarga tracking-widest text-amber-200/50">
          PAWON HARA • KATERING & BENTO NUSANTARA
        </p>
      </div>
    </main>
  )
}
