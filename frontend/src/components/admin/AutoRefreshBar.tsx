import { useEffect, useRef, useState } from 'react'

interface AutoRefreshBarProps {
  /** Callback invoked when the countdown reaches 100% */
  onRefresh: () => Promise<void> | void
  /** Refresh interval in milliseconds (default: 60000ms / 1 minute) */
  intervalMs?: number
  /** Pause countdown (e.g. when a modal is open) */
  paused?: boolean
  /** Dark mode flag */
  isDark?: boolean
}

export default function AutoRefreshBar({
  onRefresh,
  intervalMs = 60000,
  paused = false,
  isDark = false,
}: AutoRefreshBarProps) {
  const [progress, setProgress] = useState(0)
  const onRefreshRef = useRef(onRefresh)
  const elapsedRef = useRef(0)
  const isRefreshingRef = useRef(false)

  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  useEffect(() => {
    const tickMs = 200
    let timerId: ReturnType<typeof setInterval> | null = null

    const startTimer = () => {
      if (timerId) clearInterval(timerId)
      timerId = setInterval(async () => {
        if (paused || document.hidden || isRefreshingRef.current) return

        elapsedRef.current += tickMs
        const pct = Math.min(100, (elapsedRef.current / intervalMs) * 100)
        setProgress(pct)

        if (elapsedRef.current >= intervalMs) {
          elapsedRef.current = 0
          setProgress(0)
          isRefreshingRef.current = true
          try {
            await onRefreshRef.current()
          } finally {
            isRefreshingRef.current = false
          }
        }
      }, tickMs)
    }

    startTimer()

    return () => {
      if (timerId) clearInterval(timerId)
    }
  }, [intervalMs, paused])

  return (
    <div
      className={`sticky top-16 sm:top-20 z-10 w-full h-[3px] overflow-hidden ${
        isDark ? 'bg-[#2C1A18]' : 'bg-stone-200/80'
      }`}
      aria-hidden="true"
    >
      <div
        className={`h-full transition-[width] duration-200 ease-linear ${
          isDark
            ? 'bg-gradient-to-r from-[#D93832] to-[#F59E0B]'
            : 'bg-gradient-to-r from-[#9E1B16] to-[#D93832]'
        }`}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

