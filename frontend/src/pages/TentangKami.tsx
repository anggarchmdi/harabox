import {
  ArrowRight,
  Check,
  Heart,
  ShieldCheck,
  Utensils,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import Summary from '../components/ui/Summary'

const values = [
  {
    icon: Utensils,
    title: 'Rasa yang Konsisten',
    description:
      'Kami menjaga kualitas rasa dan bahan agar setiap pesanan tetap memberikan pengalaman yang sama.',
  },
  {
    icon: ShieldCheck,
    title: 'Bisa Diandalkan',
    description:
      'Mulai dari pemesanan hingga pengiriman, setiap detail kami persiapkan dengan serius.',
  },
  {
    icon: Heart,
    title: 'Dibuat dengan Kepedulian',
    description:
      'Kami percaya makanan bukan sekadar hidangan, tetapi bagian dari momen yang dibagikan bersama.',
  },
]

const highlights = [
  'Catering untuk berbagai kebutuhan acara',
  'Pilihan paket yang fleksibel',
  'Proses pemesanan yang mudah',
  'Pelayanan yang mengutamakan kepuasan pelanggan',
]

export default function TentangKami() {
  return (
    <>
      <Summary
        eyebrow="TENTANG KAMI"
        title="Lebih dari sekadar catering."
        description="Kami hadir untuk membantu menyajikan makanan yang praktis, lezat, dan berkesan untuk berbagai momen penting."
      />

      {/* Intro */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-600">
              Tentang Harabox
            </p>

            <h2 className="mt-5 max-w-xl text-4xl font-black leading-tight tracking-tight text-gray-950 sm:text-5xl">
              Makanan enak untuk momen yang berarti.
            </h2>
          </div>

          <div className="space-y-6 text-base leading-8 text-gray-600">
            <p>
              Harabox menyediakan layanan catering untuk berbagai kebutuhan,
              mulai dari acara keluarga, meeting kantor, gathering, pengajian,
              hingga berbagai kegiatan lainnya.
            </p>

            <p>
              Kami memahami bahwa mempersiapkan konsumsi untuk sebuah acara
              bukan perkara kecil. Karena itu, Harabox hadir dengan proses yang
              sederhana, pilihan menu yang praktis, dan pelayanan yang dapat
              diandalkan.
            </p>

            <p className="font-medium text-gray-900">
              Tujuan kami sederhana: membuat urusan catering menjadi lebih
              mudah sehingga Anda bisa fokus menikmati acaranya.
            </p>
          </div>
        </div>
      </section>

      {/* Highlight */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full bg-yellow-400 px-4 py-2 text-xs font-black uppercase tracking-wider text-red-950">
                Kenapa Harabox?
              </span>

              <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight text-gray-950 sm:text-5xl">
                Dibuat supaya urusan catering terasa lebih sederhana.
              </h2>
            </div>

            <div className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-black/5 sm:p-10">
              <div className="space-y-6">
                {highlights.map((item) => (
                  <div key={item} className="flex gap-4">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </div>

                    <p className="pt-0.5 text-base font-medium text-gray-800">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-600">
              Prinsip Kami
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-gray-950 sm:text-5xl">
              Hal yang kami jaga.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {values.map((value) => {
              const Icon = value.icon

              return (
                <article
                  key={value.title}
                  className="group rounded-3xl border border-gray-100 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-red-100 hover:shadow-xl hover:shadow-red-950/5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 transition group-hover:bg-red-600 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-7 text-xl font-bold text-gray-950">
                    {value.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-gray-500">
                    {value.description}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-red-600">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-20 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-yellow-400">
              Siap pesan?
            </p>

            <h2 className="mt-3 max-w-xl text-3xl font-black tracking-tight text-white sm:text-4xl">
              Biar kami yang urus catering untuk acara Anda.
            </h2>
          </div>

          <Link
            to="/menu"
            className="inline-flex shrink-0 items-center justify-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-red-600 transition hover:bg-yellow-400 hover:text-red-950"
          >
            Lihat Menu
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
