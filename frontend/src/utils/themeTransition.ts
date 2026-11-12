import type React from 'react'
import { flushSync } from 'react-dom'
import { useThemeStore, type Theme } from '../stores/theme.store'

let isTransitioning = false

/**
 * Mengganti tema aplikasi (Admin maupun Publik) dengan efek circular reveal (View Transition API).
 * Lingkaran transisi bermula dari titik koordinat tombol toggle yang diklik.
 */
export async function toggleThemeWithTransition(
  event?: React.MouseEvent<HTMLElement> | MouseEvent
): Promise<void> {
  // Cegah spam click saat transisi sedang berjalan
  if (isTransitioning) return

  if (typeof document === 'undefined') return

  const { theme: currentTheme, setTheme } = useThemeStore.getState()
  const nextTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark'

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Fallback cepat jika browser tidak mendukung View Transitions atau user memilih reduced motion
  if (!('startViewTransition' in document) || prefersReducedMotion) {
    setTheme(nextTheme)
    return
  }

  isTransitioning = true

  // 1. Tentukan titik pusat lingkaran (x, y) dari tombol toggle
  let x = typeof window !== 'undefined' ? window.innerWidth - 60 : 0
  let y = 36

  if (event) {
    const currentTarget = (event.currentTarget || event.target) as HTMLElement | null
    if (currentTarget && typeof currentTarget.getBoundingClientRect === 'function') {
      const rect = currentTarget.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        x = Math.round(rect.left + rect.width / 2)
        y = Math.round(rect.top + rect.height / 2)
      }
    } else if ('clientX' in event && typeof event.clientX === 'number') {
      if (event.clientX !== 0 || event.clientY !== 0) {
        x = Math.round(event.clientX)
        y = Math.round(event.clientY)
      }
    }
  }

  // 2. Hitung radius maksimum sampai ke sudut terjauh layar
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080
  const maxDistX = Math.max(x, viewportWidth - x)
  const maxDistY = Math.max(y, viewportHeight - y)
  const endRadius = Math.ceil(Math.hypot(maxDistX, maxDistY)) + 16

  const root = document.documentElement

  // 3. Pasang penanda CSS dan variabel koordinat pada :root
  root.classList.add('theme-transitioning')
  root.classList.add('admin-theme-transitioning')
  root.style.setProperty('--theme-transition-x', `${x}px`)
  root.style.setProperty('--theme-transition-y', `${y}px`)
  root.style.setProperty('--theme-transition-r', `${endRadius}px`)

  try {
    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(nextTheme)
      })
    })

    // Tunggu pseudo-elements siap
    await transition.ready

    // 4. Jalankan animasi lingkaran menggunakan Web Animations API pada ::view-transition-new(root)
    try {
      const animation = root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 2000,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      )
      await animation.finished
    } catch {
      // Jika root.animate dengan pseudoElement tidak didukung versi browser tertentu,
      // fallback CSS keyframes di index.css akan mengeksekusinya
    }

    await transition.finished
  } catch (err) {
    console.debug('Theme view transition ended or cancelled:', err)
  } finally {
    // 5. Bersihkan class dan custom properties setelah transisi selesai
    root.classList.remove('theme-transitioning')
    root.classList.remove('admin-theme-transitioning')
    root.style.removeProperty('--theme-transition-x')
    root.style.removeProperty('--theme-transition-y')
    root.style.removeProperty('--theme-transition-r')
    isTransitioning = false
  }
}

/**
 * Alias untuk backward-compatibility dengan AdminLayout
 */
export const toggleAdminThemeWithTransition = toggleThemeWithTransition
