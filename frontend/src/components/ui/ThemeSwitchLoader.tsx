import { useEffect, useState } from 'react'
import PageLoader from './PageLoader'
import { useThemeStore } from '../../stores/theme.store'

export default function ThemeSwitchLoader() {
  const isSwitching = useThemeStore((state) => state.isSwitching)
  const targetTheme = useThemeStore((state) => state.targetTheme)
  const currentTheme = useThemeStore((state) => state.theme)

  const [active, setActive] = useState(false)
  const [loaderTheme, setLoaderTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    if (isSwitching) {
      setActive(true)
      setLoaderTheme(targetTheme || currentTheme)
    }
  }, [isSwitching, targetTheme, currentTheme])

  if (!active) return null

  const isLight = loaderTheme === 'light'

  return (
    <PageLoader
      isLoading={isSwitching}
      theme={loaderTheme}
      text={isLight ? 'Beralih ke Mode Terang...' : 'Beralih ke Mode Gelap...'}
      subtext="Menyelaraskan tema dan tampilan Pawon Hara"
      minDuration={500}
      onFinished={() => setActive(false)}
    />
  )
}
