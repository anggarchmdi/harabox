import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BadgeCheck, MessageSquareQuote, Package, Star, UtensilsCrossed } from 'lucide-react'
import { testimonialService } from '../../services/testimonial.service'
import type { Testimonial } from '../../types/testimonial'

// Fallback jika API belum membalas atau offline
const fallbackTestimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Dian Safitri',
    institution: 'HR Officer, PT Mandiri Bersama',
    rating: 5,
    order_quantity: '85 Box',
    ordered_items: [
      { name: 'Paket Bento Katsu Komplit', quantity: 85 },
    ],
    message:
      'Nasi Box Bento Katsunya juara! Kami pesan 85 box untuk seminar kantor, makanan tiba 30 menit sebelum jadwal. Semua peserta memuji rasa ayamnya yang renyah dan kemasannya rapi.',
    is_displayed: true,
    order_code: 'HB-08101',
  },
  {
    id: 2,
    name: 'Bpk. Hendra Gunawan',
    institution: 'Yogyakarta',
    rating: 5,
    order_quantity: '50 Box',
    ordered_items: [
      { name: 'Paket Rames Balado & Nasi Kuning', quantity: 50 },
    ],
    message:
      'Rames Balado dan Nasi Kuningnya mantap bumbu meresap. Syukuran keluarga besar jadi lancar tanpa saya harus repot masak seharian di dapur. Pelayanan adminnya ramah dan komunikatif!',
    is_displayed: true,
    order_code: 'HB-08102',
  },
  {
    id: 3,
    name: 'Rian Kurniawan',
    institution: 'Ketua Panitia Dies Natalis',
    rating: 5,
    order_quantity: '120 Box',
    ordered_items: [
      { name: 'Paket Ayam Krisbar Dada Super', quantity: 120 },
    ],
    message:
      'Fast response banget via WhatsApp! Invoice langsung dikirim rapi, sangat memudahkan LPJ kegiatan kampus kami. Nasi box ayam krisbarnya favorit anak-anak organisasi.',
    is_displayed: true,
    order_code: 'HB-08103',
  },
]

export default function TestimonialSlider() {
  const { data: remoteTestimonials, isLoading } = useQuery({
    queryKey: ['testimonials'],
    queryFn: testimonialService.getPublic,
    staleTime: 60_000,
  })

  const list =
    remoteTestimonials && remoteTestimonials.length > 0
      ? remoteTestimonials
      : fallbackTestimonials

  // Duplicate items to make a seamless infinite loop
  const marqueeList = useMemo(() => {
    if (!list || list.length === 0) return []
    let base = [...list]
    while (base.length < 6) {
      base = [...base, ...list]
    }
    // Duplicate 2x for seamless 50% translate loop
    return [...base, ...base]
  }, [list])

  return (
    <div className="relative">
      {/* Slider Header Status */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
             <BadgeCheck size={14} />
          <span className="text-xs font-bold text-zinc-500">
            {list.length} Ulasan Pelanggan Terverifikasi
          </span>
        </div>
      </div>

      {/* Marquee Track Container */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-[#60241E]/80 bg-[#2D120F] p-7 shadow-lg animate-pulse h-60 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-4 w-24 bg-[#3B1814] rounded-md" />
                <div className="h-3 w-full bg-[#3B1814]/70 rounded-md" />
                <div className="h-3 w-4/5 bg-[#3B1814]/70 rounded-md" />
              </div>
              <div className="h-8 bg-[#3B1814] rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="relative overflow-hidden py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {/* Subtle gradient fades on edges */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 sm:w-20 bg-gradient-to-r from-[#1C0B09] to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 sm:w-20 bg-gradient-to-l from-[#1C0B09] to-transparent z-10" />

          {/* Continuous Auto-Scrolling Track */}
          <div className="animate-marquee-infinite flex gap-6 hover:[animation-play-state:paused]">
            {marqueeList.map((t, idx) => (
              <div
                key={`${t.id || 'testi'}-${idx}`}
                className="w-[85vw] sm:w-[360px] md:w-[380px] shrink-0 rounded-3xl border border-[#60241E]/80 bg-[#2D120F] p-6 sm:p-7 shadow-xl flex flex-col justify-between hover:shadow-2xl hover:border-[#F59E0B]/60 transition-all duration-300 relative group"
              >
                <div>
                  {/* Header: Rating & Porsi Total */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-1 text-[#F59E0B]">
                      {Array.from({ length: t.rating }).map((_, r) => (
                        <Star key={r} size={16} className="fill-[#F59E0B] text-[#F59E0B]" />
                      ))}
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-full bg-[#60241E] border border-[#F59E0B]/40 px-2.5 py-1 text-[11px] font-black text-amber-300 tracking-tight">
                      <Package size={12} className="text-[#F59E0B]" />
                      <span>{t.order_quantity}</span>
                    </span>
                  </div>

                  {/* Keterangan Pesanan: Pesan Menu Apa & Berapa Pcs */}
                  <div className="mb-4 rounded-2xl bg-[#3A1713] border border-[#60241E]/80 p-3 flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#60241E] via-[#95271D] to-[#E77B49] text-amber-300 shadow-2xs mt-0.5 ring-1 ring-[#F59E0B]/30">
                      <UtensilsCrossed size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#F59E0B] block">
                        Menu Yang Dipesan:
                      </span>
                      {t.ordered_items && t.ordered_items.length > 0 ? (
                        <div className="mt-1 space-y-1">
                          {t.ordered_items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between gap-2 text-xs font-black text-white">
                              <span className="truncate">{item.name}</span>
                              <span className="inline-flex items-center rounded-md bg-[#60241E] border border-[#F59E0B]/40 px-1.5 py-0.5 text-[11px] font-black text-amber-300 shrink-0">
                                {item.quantity} Pcs
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-0.5 flex items-center justify-between gap-2 text-xs font-black text-white">
                          <span className="truncate">Paket Katering Pawon Hara</span>
                          <span className="inline-flex items-center rounded-md bg-[#60241E] border border-[#F59E0B]/40 px-1.5 py-0.5 text-[11px] font-black text-amber-300 shrink-0">
                            {t.order_quantity}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ulasan Pesanan */}
                  <p className="text-xs sm:text-sm text-amber-100/85 leading-relaxed italic line-clamp-4">
                    "{t.message}"
                  </p>
                </div>

                {/* Footer: Nama & Instansi */}
                <div className="mt-6 pt-4 border-t border-[#60241E]/70 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-black text-white">{t.name}</h4>
                      {/* <span className="text-emerald-400" title="Terverifikasi Pemesan">
                        <BadgeCheck size={14} />
                      </span> */}
                    </div>
                    <p className="text-[11px] text-amber-200/60 font-medium mt-0.5">
                      {t.institution || 'Pelanggan Setia Pawon Hara'}
                    </p>
                  </div>

                  <div className="h-8 w-8 rounded-full bg-[#60241E] text-[#F59E0B] flex items-center justify-center border border-[#F59E0B]/30">
                    <MessageSquareQuote size={15} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
