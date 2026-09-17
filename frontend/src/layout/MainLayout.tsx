import { Outlet } from 'react-router-dom'
import Navbar from '../components/ui/Navbar'
import Footer from '../components/ui/Footer'
import ButtonCTA from '../components/ui/ButtonCTA'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#1C0B09] text-stone-100 selection:bg-[#F59E0B] selection:text-[#1C0B09]">
      <Navbar />
      <main>
        <Outlet />
      </main>

      <Footer />
      <ButtonCTA />
    </div>
  )
}
