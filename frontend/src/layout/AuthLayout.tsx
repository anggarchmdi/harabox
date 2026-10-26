import { Outlet } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import BatikParang from '../assets/batik-parang-gold.webp'
import FooterCorner from '../assets/footer-corner-gold.webp'

export default function AuthLayout() {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#150705] text-stone-100 font-sans selection:bg-[#F59E0B] selection:text-[#1C0B09]">
      {/* 1. Traditional Javanese Batik Parang Watermark Backdrop */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08] mix-blend-screen"
        style={{
          backgroundImage: `url(${BatikParang})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '900px auto',
        }}
      />

      {/* 2. Cinematic Radial Vignette (Pusat terang hangat, tepi gelap espresso) */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,#150705_88%)]" />

      {/* 3. Ambient Lighting Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F59E0B]/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#95271D]/15 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#F59E0B]/8 blur-[120px] pointer-events-none rounded-full" />

      {/* 4. Ornamen Sudut Viewport Layar (Framing Tradisional Megah ala Keraton) */}
      <div className="hidden sm:block absolute top-4 left-4 pointer-events-none select-none z-10">
        <img
          src={FooterCorner}
          alt=""
          aria-hidden="true"
          className="w-14 sm:w-16 h-auto opacity-45 -scale-y-100 drop-shadow-[0_2px_10px_rgba(245,158,11,0.2)]"
        />
      </div>
      <div className="hidden sm:block absolute top-4 right-4 pointer-events-none select-none z-10">
        <img
          src={FooterCorner}
          alt=""
          aria-hidden="true"
          className="w-14 sm:w-16 h-auto opacity-45 -scale-x-100 -scale-y-100 drop-shadow-[0_2px_10px_rgba(245,158,11,0.2)]"
        />
      </div>
      <div className="hidden sm:block absolute bottom-4 left-4 pointer-events-none select-none z-10">
        <img
          src={FooterCorner}
          alt=""
          aria-hidden="true"
          className="w-14 sm:w-16 h-auto opacity-45 drop-shadow-[0_2px_10px_rgba(245,158,11,0.2)]"
        />
      </div>
      <div className="hidden sm:block absolute bottom-4 right-4 pointer-events-none select-none z-10">
        <img
          src={FooterCorner}
          alt=""
          aria-hidden="true"
          className="w-14 sm:w-16 h-auto opacity-45 -scale-x-100 drop-shadow-[0_2px_10px_rgba(245,158,11,0.2)]"
        />
      </div>

      {/* Top Space Bar */}
      <header className="relative z-10 h-6 sm:h-10" />

      {/* Main Content Area (Memusatkan Card Login Secara Proporsional) */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 sm:py-10">
        <Outlet />
      </main>

      {/* Footer Bawah */}
      <footer className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 px-6 pb-6 text-xs text-amber-100/60 sm:flex-row sm:pb-8">
        <p className="text-[11px]">
          © {new Date().getFullYear()} Pawon Hara Catering & Bento • Dapurnya Rasa Nusantara
        </p>

        <div className="flex items-center gap-1.5 text-[11px] text-amber-300/80">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
          <span>Akses Terbatas Khusus Internal</span>
        </div>
      </footer>
    </div>
  )
}

