import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  MessageCircle,
  ShoppingBag,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import Summary from '../components/ui/Summary'

const steps = [
  {
    number: '01',
    icon: ShoppingBag,
    title: 'Pilih Menu',
    description:
      'Lihat berbagai paket catering yang tersedia dan pilih yang paling sesuai dengan kebutuhan acara Anda.',
  },
  {
    number: '02',
    icon: ClipboardList,
    title: 'Isi Detail Pesanan',
    description:
      'Masukkan data pemesan, jumlah porsi, tanggal acara, waktu, dan alamat pengiriman.',
  },
  {
    number: '03',
    icon: CalendarDays,
    title: 'Periksa Pesanan',
    description:
      'Pastikan semua informasi pesanan sudah benar sebelum melanjutkan ke tahap konfirmasi.',
  },
  {
    number: '04',
    icon: MessageCircle,
    title: 'Konfirmasi',
    description:
      'Pesanan akan dikonfirmasi dan tim Harabox akan menghubungi Anda untuk memastikan detail pesanan.',
  },
  {
    number: '05',
    icon: CheckCircle2,
    title: 'Pesanan Diproses',
    description:
      'Setelah semua detail disepakati, pesanan akan diproses dan disiapkan sesuai jadwal acara Anda.',
  },
]

export default function CaraPesan() {
  return (
    <>
      <Summary
        eyebrow="CARA PESAN"
        title="Pesan catering tanpa ribet."
        description="Dari pilih menu sampai pesanan siap diproses, semuanya dibuat sederhana supaya Anda tidak perlu repot."
      />

      {/* Steps */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="mb-14 max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-600">
              Langkah Pemesanan
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-gray-950 sm:text-5xl">
              Cuma beberapa langkah.
            </h2>

            <p className="mt-5 text-base leading-7 text-gray-500">
              Ikuti proses berikut untuk melakukan pemesanan catering Harabox.
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-8 bottom-8 hidden w-px bg-gray-200 sm:block" />

            <div className="space-y-6">
              {steps.map((step) => {
                const Icon = step.icon

                return (
                  <article
                    key={step.number}
                    className="group relative grid gap-6 rounded-3xl border border-gray-100 bg-white p-6 transition duration-300 hover:-translate-y-0.5 hover:border-red-100 hover:shadow-xl hover:shadow-red-950/5 sm:grid-cols-[72px_1fr] sm:p-7"
                  >
                    {/* Number */}
                    <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-sm font-black text-white shadow-lg shadow-red-600/20">
                      {step.number}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-950">
                          {step.title}
                        </h3>

                        <div className="hidden rounded-full bg-gray-50 p-2 text-red-600 sm:flex">
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>

                      <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-500">
                        {step.description}
                      </p>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Important info */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-yellow-400 p-8 sm:p-10">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-red-950/60">
                Tips
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-red-950">
                Siapkan detail acara Anda.
              </h2>

              <p className="mt-4 max-w-lg leading-7 text-red-950/70">
                Agar proses pemesanan lebih cepat, siapkan informasi seperti
                jumlah tamu, tanggal acara, waktu, dan lokasi pengiriman.
              </p>
            </div>

            <div className="rounded-3xl bg-red-600 p-8 text-white sm:p-10">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-400">
                Butuh bantuan?
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-tight">
                Bingung memilih paket?
              </h2>

              <p className="mt-4 leading-7 text-white/70">
                Tidak perlu khawatir. Anda bisa menghubungi tim Harabox untuk
                mendapatkan bantuan memilih menu yang sesuai dengan kebutuhan
                acara.
              </p>

              <Link
                to="/menu"
                className="mt-7 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-red-600 transition hover:bg-yellow-400 hover:text-red-950"
              >
                Lihat Menu
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <ShoppingBag className="h-6 w-6" />
          </div>

          <h2 className="mt-7 text-4xl font-black tracking-tight text-gray-950 sm:text-5xl">
            Sudah tahu mau pesan apa?
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-gray-500">
            Jelajahi menu Harabox dan temukan paket yang cocok untuk acara
            Anda.
          </p>

          <Link
            to="/menu"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-red-600 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 hover:shadow-xl"
          >
            Jelajahi Menu
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
