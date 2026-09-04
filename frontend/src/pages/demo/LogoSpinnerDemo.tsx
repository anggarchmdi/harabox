import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Eye,
  Flame,
  Layers,
  Moon,
  Play,
  RefreshCw,
  Sparkles,
  Sun,
} from 'lucide-react'
import LogoSpinner, { type LogoSpinnerProps } from '../../components/ui/LogoSpinner'

export default function LogoSpinnerDemo() {
  // Controls state
  const [size, setSize] = useState<LogoSpinnerProps['size']>('sm')
  const [theme, setTheme] = useState<'light' | 'dark' | 'glass'>('light')
  const [logoVariant, setLogoVariant] = useState<'mascot' | 'full'>('mascot')
  const [customText, setCustomText] = useState('Memproses Autentikasi...')
  const [customSubtext, setCustomSubtext] = useState('Mohon tunggu sebentar, menyiapkan akun Anda')
  const [showGlow, setShowGlow] = useState(true)
  const [showRipples, setShowRipples] = useState(true)
  const [showProgressBar, setShowProgressBar] = useState(true)

  // Fullscreen simulation state
  const [isSimulatingLogin, setIsSimulatingLogin] = useState(false)
  const [simulationStep, setSimulationStep] = useState(0)

  const simulationSteps = [
    { text: 'Memvalidasi Email & Kata Sandi...', subtext: 'Memeriksa kredensial ke server katering...' },
    { text: 'Mengamankan Sesi Admin...', subtext: 'Menerbitkan token otorisasi akun...' },
    { text: 'Menyiapkan Dashboard HaraBox...', subtext: 'Memuat data pesanan & inventaris...' },
  ]

  const handleStartLoginSimulation = () => {
    setIsSimulatingLogin(true)
    setSimulationStep(0)
  }

  useEffect(() => {
    if (!isSimulatingLogin) return

    const t1 = setTimeout(() => setSimulationStep(1), 1200)
    const t2 = setTimeout(() => setSimulationStep(2), 2400)
    const t3 = setTimeout(() => {
      setIsSimulatingLogin(false)
      setSimulationStep(0)
    }, 3600)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [isSimulatingLogin])

  return (
    <main className="min-h-screen bg-[#fafaf9] text-zinc-900 selection:bg-red-600 selection:text-white py-12 px-6 sm:px-8">
      {/* Fullscreen Simulation Active */}
      {isSimulatingLogin && (
        <LogoSpinner
          fullScreen
          size="lg"
          theme={theme}
          logoVariant={logoVariant}
          text={simulationSteps[simulationStep].text}
          subtext={simulationSteps[simulationStep].subtext}
          showGlow={showGlow}
          showRipples={showRipples}
          showProgressBar={showProgressBar}
        />
      )}

      <div className="mx-auto max-w-6xl">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-zinc-200/80">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-amber-900 shadow-sm">
              <Sparkles size={13} className="text-amber-600" />
              Demo Pratinjau (Belum Dipasang di Produksi)
            </div>
            <h1 className="mt-3 text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
              Animasi Spinner Logo <span className="text-red-600">Hara Chicken</span>
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-zinc-500 max-w-2xl">
              Pratinjau interaktif komponen loading spinner dengan logo PT/brand di tengahnya.
              Bebas dieksplorasi sebelum dipasang ke alur login asli.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/hc-admin"
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              <ArrowLeft size={14} />
              Kembali ke Login Admin
            </Link>
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800"
            >
              Ke Halaman Menu
            </Link>
          </div>
        </div>

        {/* Big Action: Trigger Fullscreen Login Simulation */}
        <div className="mt-8 rounded-3xl bg-gradient-to-r from-red-600 via-red-500 to-orange-500 p-6 sm:p-8 text-white shadow-xl shadow-red-600/20 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <span className="rounded-full bg-white/20 border border-white/30 px-3 py-1 text-[10px] font-black uppercase tracking-wider">
              Simulasi Interaktif
            </span>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Coba Sensasi Fullscreen Login Loading (3.5 Detik)
            </h2>
            <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-xl">
              Klik tombol di samping untuk melihat bagaimana animasi ini bekerja secara sinematis
              saat pengguna menekan tombol "Masuk ke Akun".
            </p>
          </div>

          <button
            type="button"
            onClick={handleStartLoginSimulation}
            className="inline-flex shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-white text-zinc-950 px-6 py-4 text-xs sm:text-sm font-black shadow-lg transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Play size={16} className="fill-red-600 text-red-600" />
            <span>Mulai Simulasi Login</span>
          </button>
        </div>

        {/* Main Grid: Sandbox Controls (Left) & Live Canvas (Right) */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Panel (Col 5) */}
          <div className="lg:col-span-5 rounded-[2rem] border border-zinc-200 bg-white p-6 sm:p-7 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <h3 className="text-base font-black text-zinc-950 flex items-center gap-2">
                <Layers size={18} className="text-red-600" />
                Panel Konfigurasi
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSize('lg')
                  setTheme('light')
                  setLogoVariant('mascot')
                  setCustomText('Memproses Autentikasi...')
                  setCustomSubtext('Mohon tunggu sebentar, menyiapkan akun Anda')
                  setShowGlow(true)
                  setShowRipples(true)
                  setShowProgressBar(true)
                }}
                className="text-[11px] font-bold text-zinc-400 hover:text-zinc-900 transition flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={12} />
                Reset
              </button>
            </div>

            {/* 1. Theme Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                Tema Latar
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'light', label: 'Terang', icon: Sun },
                  { id: 'dark', label: 'Gelap (Obsidian)', icon: Moon },
                  { id: 'glass', label: 'Glassmorphism', icon: Sparkles },
                ].map((t) => {
                  const Icon = t.icon
                  const isSelected = theme === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id as any)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                        isSelected
                          ? 'border-red-600 bg-red-50 text-red-700 shadow-xs'
                          : 'border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      <Icon size={16} className={isSelected ? 'text-red-600' : 'text-zinc-400'} />
                      <span className="mt-1">{t.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Logo Style Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                Model Logo di Tengah
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLogoVariant('mascot')}
                  className={`p-3 rounded-2xl border text-left text-xs font-bold transition cursor-pointer ${
                    logoVariant === 'mascot'
                      ? 'border-red-600 bg-red-50 text-red-700 shadow-xs'
                      : 'border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <span className="block font-black">Emblem Maskot Lingkar</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Ikonik, rapi & pas dalam lingkaran</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLogoVariant('full')}
                  className={`p-3 rounded-2xl border text-left text-xs font-bold transition cursor-pointer ${
                    logoVariant === 'full'
                      ? 'border-red-600 bg-red-50 text-red-700 shadow-xs'
                      : 'border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <span className="block font-black">Logo Lengkap Pill</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Menampilkan tulisan HARA Chicken</span>
                </button>
              </div>
            </div>

            {/* 3. Size Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                Ukuran Spinner
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'sm', label: 'Small' },
                  { id: 'md', label: 'Medium' },
                  { id: 'lg', label: 'Large' },
                  { id: 'xl', label: 'Extra' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSize(s.id as any)}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition cursor-pointer text-center ${
                      size === s.id
                        ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Text Customization */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Teks Status Utama
                </label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Contoh: Memproses Autentikasi..."
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-900 outline-none focus:border-red-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Subteks Keterangan
                </label>
                <input
                  type="text"
                  value={customSubtext}
                  onChange={(e) => setCustomSubtext(e.target.value)}
                  placeholder="Contoh: Menghubungkan ke sistem..."
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-900 outline-none focus:border-red-600 focus:bg-white transition"
                />
              </div>
            </div>

            {/* 5. Effect Toggles */}
            <div className="pt-2 border-t border-zinc-100 space-y-2.5">
              <label className="flex items-center justify-between text-xs font-bold text-zinc-700 cursor-pointer">
                <span>Efek Cahaya (Glow Orbs)</span>
                <input
                  type="checkbox"
                  checked={showGlow}
                  onChange={(e) => setShowGlow(e.target.checked)}
                  className="h-4 w-4 rounded accent-red-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-bold text-zinc-700 cursor-pointer">
                <span>Efek Gelombang Radar (Ripples)</span>
                <input
                  type="checkbox"
                  checked={showRipples}
                  onChange={(e) => setShowRipples(e.target.checked)}
                  className="h-4 w-4 rounded accent-red-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-bold text-zinc-700 cursor-pointer">
                <span>Shimmer Progress Bar</span>
                <input
                  type="checkbox"
                  checked={showProgressBar}
                  onChange={(e) => setShowProgressBar(e.target.checked)}
                  className="h-4 w-4 rounded accent-red-600 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Live Canvas Preview (Col 7) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* The Stage */}
            <div
              className={`relative overflow-hidden rounded-[2.5rem] border transition-colors duration-500 p-12 min-h-[460px] flex items-center justify-center ${
                theme === 'dark'
                  ? 'bg-zinc-950 border-zinc-800 shadow-2xl shadow-black/40'
                  : theme === 'glass'
                  ? 'bg-gradient-to-br from-amber-50/50 via-white to-red-50/40 border-zinc-200 shadow-xl'
                  : 'bg-white border-zinc-200 shadow-xl shadow-zinc-950/5'
              }`}
            >
              {/* Decorative Stage Grid / Ambient Lights */}
              <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-red-500/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl" />

              {/* Badges on stage top */}
              <div className="absolute top-5 left-6 text-[11px] font-black uppercase tracking-wider text-zinc-400">
                Pratinjau Langsung
              </div>

              <div className="absolute top-5 right-6 flex items-center gap-1.5 rounded-full bg-black/5 dark:bg-white/10 px-3 py-1 text-[10px] font-bold text-zinc-500">
                <Eye size={12} />
                <span>Mode: {theme}</span>
              </div>

              {/* The Star: LogoSpinner Component */}
              <LogoSpinner
                size={size}
                theme={theme}
                logoVariant={logoVariant}
                text={customText}
                subtext={customSubtext}
                showGlow={showGlow}
                showRipples={showRipples}
                showProgressBar={showProgressBar}
              />
            </div>

            {/* Login Card Mockup Context Preview */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-red-600 mb-2">
                <Flame size={14} />
                Konteks Penggunaan: Modal / Form Login
              </div>
              <h3 className="text-lg font-black text-zinc-950">
                Bagaimana jika disematkan di dalam Card Form Login?
              </h3>
              <p className="text-xs text-zinc-500 mt-1 mb-6">
                Ini adalah simulasi saat spinner aktif di dalam card login admin tanpa menutup seluruh layar.
              </p>

              <div className="mx-auto max-w-sm rounded-3xl border border-zinc-200/90 bg-[#fafaf9] p-8 shadow-md">
                <LogoSpinner
                  size="md"
                  theme="light"
                  logoVariant="mascot"
                  text="Memverifikasi Akun..."
                  subtext="Sinkronisasi kredensial admin HaraBox"
                  showGlow={false}
                  showRipples={true}
                  showProgressBar={true}
                />
              </div>
            </div>

            {/* Code Snippet for Future Installation */}
            <div className="rounded-[2rem] border border-zinc-200 bg-zinc-900 p-6 text-white font-mono text-xs shadow-md">
              <div className="flex items-center justify-between text-zinc-400 mb-3 border-b border-zinc-800 pb-2">
                <span className="font-bold text-zinc-300">Cara Memasang Saat Siap Digunakan:</span>
                <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-amber-400">Siap Pakai Kapan Saja</span>
              </div>
              <pre className="text-zinc-300 overflow-x-auto leading-relaxed">
{`// Cukup import di halaman login atau dashboard:
import LogoSpinner from '@/components/ui/LogoSpinner'

// Opsi 1: Layar Penuh (Fullscreen Overlay saat Login)
{loading && <LogoSpinner fullScreen text="Memproses Login..." />}

// Opsi 2: Di dalam Card Form
{loading && <LogoSpinner size="md" text="Memvalidasi..." />}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
