import { Outlet } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import BackgroundImg from '../assets/background.webp'

export default function AuthLayout() {
  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-[#1C0B09] text-stone-100 font-sans selection:bg-[#F59E0B] selection:text-[#1C0B09]">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-sm scale-105 opacity-40"
        style={{
          backgroundImage: `url(${BackgroundImg})`,
        }}
      />

      {/* Background Overlay / Dark Chocolate Blur Layer */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1C0B09]/90 via-[#240E0C]/85 to-[#1C0B09]/95 backdrop-blur-md" />

      {/* Top Header Bar */}
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-4 pt-6 sm:px-8 sm:pt-8">
      </header>

      {/* Main Content Area (Focused on Login) */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[420px]">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 px-4 pb-6 text-xs text-amber-100/70 sm:flex-row sm:px-8 sm:pb-8">
        <p className="text-[11px]">
          © 2026 Pawon Hara Catering & Bento. Hak Cipta Dilindungi.
        </p>

        <div className="flex items-center gap-1.5 text-[11px] text-amber-300">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
          <span>Akses Terbatas Khusus Internal</span>
        </div>
      </footer>
    </div>
  )
}
