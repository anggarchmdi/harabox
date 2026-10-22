import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import TraditionalLoader from './TraditionalLoader'
import { useThemeStore } from '../../stores/theme.store'
import BatikParang from '../../assets/batik-parang-gold.webp'

export interface PageLoaderProps {
  /** Whether the page is currently in loading state */
  isLoading: boolean
  /** Primary loading status message */
  text?: string
  /** Secondary subtitle / hint */
  subtext?: string
  /** Minimum display duration in milliseconds to prevent flashing (default: 700ms) */
  minDuration?: number
  /** Callback fired when loader transition finishes */
  onFinished?: () => void
  /** Visual theme override */
  theme?: 'light' | 'dark'
}

/**
 * Pola Watermark Samar Batik Parang Emas Keraton (Selaras dengan Footer)
 */
function BatikWatermarkBackdrop({ isDark }: { isDark: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Motif Batik Parang Asli dari aset (berwarna emas keraton hangat & halus) */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          isDark
            ? 'opacity-5 mix-blend-screen'
            : 'opacity-15 mix-blend-multiply'
        }`}
        style={{
          backgroundImage: `url(${BatikParang})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '1200px auto',
        }}
      />

      {/* Radial Vignette agar bagian tengah loader tetap jernih & berfokus pada konten loader */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          isDark
            ? 'bg-[radial-gradient(ellipse_at_center,transparent_65%,#1C0B09_92%)]'
            : 'bg-[radial-gradient(ellipse_at_center,transparent_65%,#FBF7F2_92%)]'
        }`}
      />
    </div>
  )
}

export function PageLoader({
  isLoading,
  text = 'Memuat Halaman...',
  subtext,
  minDuration = 700,
  onFinished,
  theme: explicitTheme,
}: PageLoaderProps) {
  const storeTheme = useThemeStore((s) => s.theme)
  const isDark = (explicitTheme || storeTheme) === 'dark'

  const [mounted, setMounted] = useState(false)
  const [shouldRender, setShouldRender] = useState(true)
  const [isFadingOut, setIsFadingOut] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isLoading) {
      setShouldRender(true)
      setIsFadingOut(false)
    }
  }, [isLoading])

  useEffect(() => {
    let minTimePassed = false
    let minTimer: ReturnType<typeof setTimeout> | null = null
    let fadeTimer: ReturnType<typeof setTimeout> | null = null

    // Pastikan durasi minimal sebelum loader ditutup agar transisi mulus
    minTimer = setTimeout(() => {
      minTimePassed = true
      if (!isLoading) {
        startFadeOut()
      }
    }, minDuration)

    const startFadeOut = () => {
      setIsFadingOut(true)
      fadeTimer = setTimeout(() => {
        setShouldRender(false)
        if (onFinished) onFinished()
      }, 400) // 400ms fade transition
    }

    if (!isLoading && minTimePassed) {
      startFadeOut()
    }

    return () => {
      if (minTimer) clearTimeout(minTimer)
      if (fadeTimer) clearTimeout(fadeTimer)
    }
  }, [isLoading, minDuration, onFinished])

  if (!shouldRender) return null

  const loaderOverlay = (
    <div
      className={`fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-screen h-[100dvh] z-[99999] overflow-hidden flex items-center justify-center backdrop-blur-md transition-all duration-400 ease-out ${
        isDark ? 'bg-[#1C0B09]/96 text-[#FAF5EE]' : 'bg-[#FBF7F2]/96 text-[#2B120E]'
      } ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
      }}
      aria-live="polite"
      aria-busy="true"
    >
      {/* Watermark Latar Belakang Motif Batik Parang Emas (Konsisten dengan Footer) */}
      <BatikWatermarkBackdrop isDark={isDark} />

      {/* Pendaran Kehangatan Tungku Tradisional Pawon Hara */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl overflow-hidden -z-10">
        <div
          className={`w-full h-full rounded-full transition-colors duration-500 animate-hearth-glow ${
            isDark ? 'bg-[#60241E]/40' : 'bg-amber-200/50'
          }`}
        />
      </div>
      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl overflow-hidden -z-10">
        <div
          className={`w-full h-full rounded-full transition-colors duration-500 ${
            isDark ? 'bg-[#F59E0B]/15' : 'bg-orange-200/35'
          }`}
        />
      </div>

      <div className="relative z-10">
        <TraditionalLoader
          variant="kendil"
          size="lg"
          theme={isDark ? 'dark' : 'light'}
          text={text}
          subtext={subtext}
          showSteam={true}
          showGlow={true}
          showEmbers={true}
          showBrandBadge={true}
          fullScreen={false}
        />
      </div>
    </div>
  )

  if (mounted && typeof document !== 'undefined') {
    return createPortal(loaderOverlay, document.body)
  }

  return loaderOverlay
}

export default PageLoader
