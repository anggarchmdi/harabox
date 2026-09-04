import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import AOS from 'aos'

export default function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    const html = document.documentElement
    const originalScrollBehavior = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' as ScrollBehavior,
    })
    document.body.scrollTop = 0
    html.scrollTop = 0

    html.style.scrollBehavior = originalScrollBehavior

    const timer = setTimeout(() => {
      AOS.refresh()
    }, 80)

    return () => clearTimeout(timer)
  }, [pathname, search])

  return null
}
