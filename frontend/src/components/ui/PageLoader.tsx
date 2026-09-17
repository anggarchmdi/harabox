import { useEffect, useState } from 'react'
import LogoSpinner from './LogoSpinner'

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
}

export function PageLoader({
  isLoading,
  text = 'Memuat Halaman...',
  subtext,
  minDuration = 700,
  onFinished,
}: PageLoaderProps) {
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
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#1C0B09]/95 backdrop-blur-md transition-opacity duration-400 ease-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      aria-live="polite"
      aria-busy="true"
    >
      <LogoSpinner
        size="md"
        theme="dark"
        logoVariant="mascot"
        text={text}
        subtext={subtext}
        fullScreen={false}
      />
    </div>
  )
}

export default PageLoader
