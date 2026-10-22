import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useThemeStore } from '../../stores/theme.store'

import HeroImg1 from '../../assets/hero-desktop-1.webp'
import HeroMob1 from '../../assets/hero-mobile-1.webp'


export interface HeroSlideItem {
  id: number
  image: string
  alt: string
}

/**
 * Slide untuk Desktop & Tablet (md sampai 2xl)
 * Menggunakan gambar banner widescreen (1920x600)
 */
export const desktopHeroSlides: HeroSlideItem[] = [
  {
    id: 1,
    image: HeroImg1,
    alt: 'Pawon Hara Catering - Aneka Nasi Box & Bento Lezat',
  },
//   {
//     id: 2,
//     image: HeroImg2,
//     alt: 'Dapur Higienis & Profesional Pawon Hara',
//   },
//   {
//     id: 4,
//     image: HeroImg4,
//     alt: 'Kemasan Rapi & Eksklusif Siap Santap',
//   },
]

/**
 * Slide khusus untuk Mobile (< md)
 * Menggunakan gambar rasio kotak / portrait ideal untuk layar smartphone
 */
export const mobileHeroSlides: HeroSlideItem[] = [
  {
    id: 3,
    image: HeroMob1,
    alt: 'Pawon Hara Catering - Kemasan Rapi & Siap Santap',
  },
]

interface HeroSliderProps {
  whatsappUrl?: string
}

export default function HeroSlider({
  whatsappUrl = 'https://wa.me/6281122225520?text=' +
    encodeURIComponent('Halo Pawon Hara, saya ingin konsultasi pemesanan katering nasi box untuk acara saya.'),
}: HeroSliderProps) {
  const theme = useThemeStore((state) => state.theme)
  const isDark = theme === 'dark'

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isSlideHovered, setIsSlideHovered] = useState(false)

  // Deteksi ukuran layar responsif (< 768px = mobile)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )

  useEffect(() => {
    const handleResize = () => {
      const mobileView = window.innerWidth < 768
      setIsMobile((prev) => {
        if (prev !== mobileView) {
          setCurrentSlide(0) // Reset slide saat resize breakpoint berubah
        }
        return mobileView
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const activeSlides = isMobile ? mobileHeroSlides : desktopHeroSlides

  // Auto slider timer (hanya berputar jika slide aktif > 1)
  useEffect(() => {
    if (isSlideHovered || activeSlides.length <= 1) return

    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length)
    }, 5000)

    return () => clearInterval(slideTimer)
  }, [isSlideHovered, activeSlides.length])

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length)
  }

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % activeSlides.length)
  }

  return (
    <section
      className={`w-full h-[400px] sm:h-[450px] md:h-[480px] xl:h-[600px] relative overflow-hidden select-none transition-colors duration-300 ${
        isDark ? 'bg-[#1C0B09]' : 'bg-black'
      }`}
      onMouseEnter={() => setIsSlideHovered(true)}
      onMouseLeave={() => setIsSlideHovered(false)}
    >
      {/* =========================================================================
          1. SLIDES KHUSUS MOBILE (< md: hero-pawon-3)
      ========================================================================== */}
      <div className="block md:hidden absolute inset-0 w-full h-full">
        {mobileHeroSlides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              idx === (currentSlide % mobileHeroSlides.length)
                ? 'opacity-100 z-0'
                : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.alt}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* =========================================================================
          2. SLIDES KHUSUS TABLET & DESKTOP (md s/d 2xl: hero-pawon-1, 2, 4)
      ========================================================================== */}
      <div className="hidden md:block absolute inset-0 w-full h-full">
        {desktopHeroSlides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              idx === (currentSlide % desktopHeroSlides.length)
                ? 'opacity-100 z-0'
                : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.alt}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Ambient Gradient Overlay for optimal contrast & seamless blending */}
      <div className="absolute inset-0 z-10 pointer-events-none" />

      {/* =========================================================================
          NAVIGATION CONTROLS (AESTHETIC PREV & NEXT BUTTONS)
      ========================================================================== */}
      {activeSlides.length > 1 && (
        <div className="absolute inset-x-0 top-[38%] sm:top-[42%] md:top-[44%] -translate-y-1/2 z-20 pointer-events-none px-3 sm:px-6 lg:px-8">
          <div className=" mx-auto flex items-center justify-between">
            {/* Prev Button */}
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Slide sebelumnya"
              className="group pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/75 active:bg-black/90 backdrop-blur-md border border-white/25 hover:border-[#F59E0B] text-stone-200 hover:text-[#F59E0B] shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(245,158,11,0.45)] transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft size={22} className="transition-transform duration-300 group-hover:-translate-x-0.5" />
            </button>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNext}
              aria-label="Slide berikutnya"
              className="group pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/75 active:bg-black/90 backdrop-blur-md border border-white/25 hover:border-[#F59E0B] text-stone-200 hover:text-[#F59E0B] shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(245,158,11,0.45)] transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer"
            >
              <ChevronRight size={22} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. ACTION BUTTONS OVERLAY LAYER (Premium Glassmorphism Dock)
      ========================================================================== */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end pointer-events-none">
        <div className="w-full bg-gradient-to-t from-black/85 via-black/40 to-transparent pt-12 pb-3 sm:pb-6 px-3 sm:px-8">
          <div className="max-w-7xl mx-auto w-full pointer-events-auto">
            {/* Floating Glassmorphism Action Capsule */}
            <div
              className={`
                w-full rounded-2xl sm:rounded-full p-2.5 sm:p-3
                backdrop-blur-xl transition-all duration-300
                ${
                  isDark
                    ? 'bg-[#1C0B09]/85 border border-[#60241E]/80 shadow-[0_12px_40px_rgba(0,0,0,0.6)] ring-1 ring-white/10'
                    : 'bg-white/80 border border-[#E6DACD] shadow-[0_12px_36px_rgba(96,36,30,0.12)] ring-1 ring-[#8C4320]/10'
                }
              `}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-4">
                {/* Left / Top Row (Mobile): Slide Progress Indicators */}
                <div className="flex items-center justify-between gap-3 px-1 sm:px-2">
                  <div className="flex items-center gap-2" />

                  {/* Indikator Titik Slide Khusus Mobile */}
                  <div className="flex md:hidden items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 shadow-inner">
                    {mobileHeroSlides.map((_, idx) => (
                      <span
                        key={idx}
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          idx === (currentSlide % mobileHeroSlides.length)
                            ? 'w-5 sm:w-6 bg-gradient-to-r from-amber-400 to-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                            : 'w-1.5 bg-white/35'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Indikator Titik Slide Khusus Tablet & Desktop */}
                  <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 shadow-inner">
                    {desktopHeroSlides.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentSlide(idx)}
                        aria-label={`Pindah ke slide ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                          idx === (currentSlide % desktopHeroSlides.length)
                            ? 'w-5 sm:w-6 bg-gradient-to-r from-amber-400 to-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                            : 'w-1.5 bg-white/35 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Right / Bottom Row: Action Buttons */}
                <div className="grid grid-cols-2 md:flex items-center gap-2 sm:gap-2.5">
                  {/* Primary Action Button */}
                  <Link
                    to="/menu#menu-list"
                    className="
                      group flex items-center justify-center gap-1.5 sm:gap-2
                      rounded-xl sm:rounded-full
                      bg-gradient-to-r from-[#F59E0B] via-amber-400 to-[#E77B49]
                      hover:from-amber-400 hover:to-amber-500
                      px-3.5 sm:px-6 py-2.5 sm:py-3
                      text-xs sm:text-sm font-black text-[#1C0B09]
                      shadow-md shadow-[#F59E0B]/30
                      transition-all duration-300
                      hover:-translate-y-0.5
                      hover:shadow-lg hover:shadow-[#F59E0B]/40
                      active:scale-95
                      text-center whitespace-nowrap
                    "
                  >
                    <ShoppingBag size={15} className="shrink-0 text-[#1C0B09]" />
                    <span>Monggo, Pinarak</span>
                  </Link>

                  {/* WhatsApp Action Button */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
                      group flex items-center justify-center gap-1.5 sm:gap-2
                      rounded-xl sm:rounded-full
                      px-3 sm:px-5 py-2.5 sm:py-3
                      text-xs sm:text-sm font-bold
                      transition-all duration-300
                      hover:-translate-y-0.5
                      active:scale-95
                      text-center whitespace-nowrap
                      border backdrop-blur-md
                      ${
                        isDark
                          ? 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/40 shadow-sm'
                          : 'bg-emerald-700/90 border-emerald-300/80 shadow-sm'
                      }
                    `}
                  >
                    <MessageCircle
                      size={15}
                      className="shrink-0 text-emerald-400 group-hover:scale-110 transition-transform"
                    />
                    <span className="text-emerald-400">WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
