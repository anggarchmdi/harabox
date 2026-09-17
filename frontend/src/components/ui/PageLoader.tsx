import { useEffect, useState } from 'react'
import LogoSpinner from './LogoSpinner'
import { useThemeStore } from '../../stores/theme.store'

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

  const [shouldRender, setShouldRender] = useState(true)
  const [isFadingOut, setIsFadingOut] = useState(false)

  useEffect(() => {
    let minTimePassed = false
    let minTimer: ReturnType<typeof setTimeout> | null = null
    let fadeTimer: ReturnType<typeof setTimeout> | null = null

    // Track minimum duration
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

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-md transition-all duration-400 ease-out ${
        isDark ? 'bg-[#1C0B09]/95 text-stone-100' : 'bg-[#FBF7F2]/95 text-[#2B120E]'
      } ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-live="polite"
      aria-busy="true"
    >
      {/* Ambient Decorative Blurs */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl overflow-hidden -z-10">
        <div className={`w-full h-full rounded-full transition-colors duration-300 ${
          isDark ? 'bg-[#60241E]/30' : 'bg-amber-200/40'
        }`} />
      </div>
      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl overflow-hidden -z-10">
        <div className={`w-full h-full rounded-full transition-colors duration-300 ${
          isDark ? 'bg-[#F59E0B]/15' : 'bg-orange-200/30'
        }`} />
      </div>

      <LogoSpinner
        size="md"
        theme={isDark ? 'dark' : 'light'}
        logoVariant="mascot"
        text={text}
        subtext={subtext}
        fullScreen={false}
      />
    </div>
  )
}

export default PageLoader
