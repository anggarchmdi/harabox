import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Clock3, ShoppingBag } from 'lucide-react'

import { packageService } from '../services/packages.service'

export default function MenuPage() {
  const {
    data: packages,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['packages'],
    queryFn: packageService.getAll,
  })

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f8f8f6]">
        <section className="mx-auto max-w-7xl px-6 pb-20 pt-32 lg:px-8">
          <div className="animate-pulse">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="mt-5 h-14 max-w-xl rounded bg-gray-200" />
            <div className="mt-4 h-6 max-w-2xl rounded bg-gray-200" />

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-3xl bg-white"
                >
                  <div className="h-72 bg-gray-200" />
                  <div className="space-y-4 p-6">
                    <div className="h-6 w-2/3 rounded bg-gray-200" />
                    <div className="h-4 w-full rounded bg-gray-200" />
                    <div className="h-10 w-1/2 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (isError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f8f6] px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">
            Menu
          </p>

          <h1 className="mt-3 text-3xl font-black text-gray-950">
            Menu belum dapat ditampilkan
          </h1>

          <p className="mt-3 text-gray-500">
            Terjadi masalah saat mengambil data menu.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-[#f8f8f6]">
      {/* =====================================================
          HERO / SUMMARY
      ====================================================== */}
      <section className="relative overflow-hidden bg-red-600 text-white">
        {/* Decorative shapes */}
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-red-500" />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-red-700/40" />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-36 lg:px-8 lg:pb-28 lg:pt-40">
          <div className="grid items-end gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-300">
                Hara Chicken
              </p>

              <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-8xl">
                Pilihan menu
                <br />
                untuk acara
                <br />
                <span className="text-yellow-300">yang berarti.</span>
              </h1>
            </div>

            <div className="lg:pb-2">
              <p className="max-w-md text-base leading-7 text-white/75 sm:text-lg">
                Dari meeting kantor, acara keluarga, pengajian, hingga
                gathering. Pilih paket catering yang paling sesuai dengan
                kebutuhanmu.
              </p>

              <div className="mt-8 flex items-center gap-3 text-sm font-semibold">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-red-700">
                  <ShoppingBag size={18} />
                </span>

                <span>
                  {packages?.length ?? 0} pilihan paket tersedia
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          MENU
      ====================================================== */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        {/* Section heading */}
        <div className="flex flex-col justify-between gap-6 border-b border-gray-200 pb-8 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-600">
              Our Menu
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-tight text-gray-950 sm:text-5xl">
              Pilih paket favoritmu.
            </h2>
          </div>

          <p className="max-w-md text-sm leading-6 text-gray-500 md:text-right">
            Semua paket disiapkan untuk kebutuhan catering dalam jumlah
            banyak dengan pilihan menu yang praktis dan nikmat.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {packages?.map((item) => (
            <article
              key={item.id}
              className="group flex flex-col overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-black/[0.06] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-red-50">
                    <ShoppingBag
                      size={48}
                      strokeWidth={1.5}
                      className="text-red-200"
                    />
                  </div>
                )}

                {/* Minimum order */}
                <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-xs font-bold text-gray-800 shadow-lg backdrop-blur">
                  <ShoppingBag size={14} className="text-red-600" />
                  Min. {item.minimum_order}
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-gray-950">
                    {item.name}
                  </h3>

                  {item.description && (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-500">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Bottom */}
                <div className="mt-8 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Mulai dari
                    </p>

                    <p className="mt-1 text-2xl font-black tracking-tight text-red-600">
                      Rp {Number(item.price).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-950 text-white transition-all duration-300 group-hover:bg-red-600"
                    aria-label={`Pesan ${item.name}`}
                  >
                    <ArrowRight
                      size={19}
                      className="transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Empty state */}
        {packages?.length === 0 && (
          <div className="py-24 text-center">
            <ShoppingBag
              size={48}
              strokeWidth={1.5}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-5 text-2xl font-black text-gray-900">
              Belum ada menu
            </h3>

            <p className="mt-2 text-gray-500">
              Menu catering belum tersedia saat ini.
            </p>
          </div>
        )}
      </section>

      {/* =====================================================
          CTA
      ====================================================== */}
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8 lg:pb-28">
        <div className="relative overflow-hidden rounded-[2rem] bg-gray-950 px-7 py-12 text-white sm:px-12 lg:px-16 lg:py-16">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-600/30 blur-2xl" />

          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-yellow-400">
                Siap pesan?
              </p>

              <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Biar urusan catering, kami yang siapkan.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
                Pilih paket, tentukan jumlah pesanan, lalu biarkan Hara
                Chicken menyiapkan hidangan untuk acaramu.
              </p>
            </div>

            <a
              href="/order"
              className="inline-flex shrink-0 items-center justify-center gap-3 rounded-full bg-yellow-400 px-7 py-4 text-sm font-black text-red-900 transition hover:bg-yellow-300"
            >
              Pesan Sekarang
              <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
