import { Outlet } from 'react-router-dom'
import Navbar from '../components/ui/Navbar'
import Footer from '../components/ui/Footer'
import ButtonCTA from '../components/ui/ButtonCTA'
import { useThemeStore } from '../stores/theme.store'

export default function MainLayout() {
  const theme = useThemeStore((state) => state.theme)
  const isDark = theme === 'dark'

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark
          ? 'bg-[#1C0B09] text-stone-100 selection:bg-[#F59E0B] selection:text-[#1C0B09]'
          : 'bg-[#FBF7F2] text-[#2B120E] selection:bg-[#F59E0B] selection:text-[#2B120E]'
      }`}
    >
      <Navbar />
      <main>
        <Outlet />
      </main>

      <Footer />
      <ButtonCTA />
    </div>
  )
}
