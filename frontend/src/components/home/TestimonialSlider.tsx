import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, MessageSquareQuote, Star } from 'lucide-react'
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
    message:
      'Fast response banget via WhatsApp! Invoice langsung dikirim rapi, sangat memudahkan LPJ kegiatan kampus kami. Nasi box ayam krisbarnya favorit anak-anak organisasi.',
    is_displayed: true,
    order_code: 'HB-08103',
  },
]

export default function TestimonialSlider() {
  const sliderRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const { data: remoteTestimonials, isLoading } = useQuery({
    queryKey: ['testimonials'],
    queryFn: testimonialService.getPublic,
    staleTime: 60_000,
  })

  const list =
    remoteTestimonials && remoteTestimonials.length > 0
      ? remoteTestimonials
      : fallbackTestimonials

  // Update scroll button states and active dot index
  const updateScrollState = () => {
    if (!sliderRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)

    // Calculate approximate active card index
    const cardWidth = 380
    const index = Math.round(scrollLeft / cardWidth)
    setActiveIndex(Math.min(Math.max(index, 0), list.length - 1))
  }

  useEffect(() => {
    const el = sliderRef.current
    if (!el) return

    updateScrollState()
    el.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)

    return () => {
      el.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [list.length])

  // Optional subtle auto-advance if multiple items and not hovered
  useEffect(() => {
    if (isPaused || list.length <= 1) return

    const interval = setInterval(() => {
      if (!sliderRef.current) return
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        sliderRef.current.scrollBy({ left: 380, behavior: 'smooth' })
      }
    }, 6000)

    return () => clearInterval(interval)
  }, [isPaused, list.length])

  const scrollPrev = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -380, behavior: 'smooth' })
    }
  }

  const scrollNext = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 380, behavior: 'smooth' })
    }
  }

  const scrollToIndex = (index: number) => {
    if (sliderRef.current) {
      sliderRef.current.scrollTo({ left: index * 380, behavior: 'smooth' })
    }
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slider Controls Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-zinc-500">
            {list.length} Ulasan Pelanggan Terverifikasi
          </span>
        </div>

        {/* Panah Navigasi Slider */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={scrollPrev}
            disabled={!canScrollLeft}
            aria-label="Geser testimoni sebelumnya"
            className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition-all cursor-pointer ${
              canScrollLeft
                ? 'border-zinc-300 bg-white text-zinc-800 shadow-xs hover:border-red-500 hover:bg-red-50 hover:text-red-700 active:scale-95'
                : 'border-zinc-200 bg-zinc-100/70 text-zinc-300 cursor-not-allowed opacity-60'
            }`}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            disabled={!canScrollRight}
            aria-label="Geser testimoni berikutnya"
            className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition-all cursor-pointer ${
              canScrollRight
                ? 'border-zinc-300 bg-white text-zinc-800 shadow-xs hover:border-red-500 hover:bg-red-50 hover:text-red-700 active:scale-95'
                : 'border-zinc-200 bg-zinc-100/70 text-zinc-300 cursor-not-allowed opacity-60'
            }`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Slider Track */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-zinc-200/80 bg-white p-7 shadow-xs animate-pulse h-60 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-4 w-24 bg-zinc-200 rounded-md" />
                <div className="h-3 w-full bg-zinc-100 rounded-md" />
                <div className="h-3 w-4/5 bg-zinc-100 rounded-md" />
              </div>
              <div className="h-8 bg-zinc-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={sliderRef}
          className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {list.map((t, idx) => (
            <div
              key={t.id || idx}
              className="w-[85vw] sm:w-[360px] md:w-[380px] shrink-0 snap-start rounded-3xl border border-zinc-200/80 bg-white p-7 shadow-xs flex flex-col justify-between hover:shadow-xl hover:border-red-200 transition-all duration-300 relative group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: t.rating }).map((_, r) => (
                      <Star key={r} size={16} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-700 tracking-tight">
                    {t.order_quantity}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed italic line-clamp-5">
                  "{t.message}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-zinc-950">{t.name}</h4>
                  <p className="text-[11px] text-zinc-400">
                    {t.institution || 'Pelanggan Setia HaraBox'}
                  </p>
                </div>

                <div className="h-8 w-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                  <MessageSquareQuote size={15} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Indicators / Dots */}
      {list.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1.5">
          {list.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={() => scrollToIndex(dotIdx)}
              aria-label={`Pindah ke testimoni ${dotIdx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                activeIndex === dotIdx
                  ? 'w-6 bg-red-600'
                  : 'w-2 bg-zinc-300 hover:bg-zinc-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
