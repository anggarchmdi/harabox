import { Outlet } from 'react-router-dom'
import Navbar from '../components/ui/Navbar'
import Footer from '../components/ui/Footer'
import ButtonCTA from '../components/ui/ButtonCTA'
    
export default function MainLayout() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Outlet />
      </main>

      <Footer />
    <ButtonCTA />
    </div>
  )
}
