import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Eye,
  Flame,
  Layers,
  Moon,
  Play,
  RefreshCw,
  Sparkles,
  Sun,
  UtensilsCrossed,
  Wind,
} from 'lucide-react'
import LogoSpinner from '../../components/ui/LogoSpinner'
import TraditionalLoader, {
  type TraditionalLoaderVariant,
  type TraditionalLoaderProps,
} from '../../components/ui/TraditionalLoader'

export default function LogoSpinnerDemo() {
  // Mode tampilan utama: 'traditional' (revisi baru) atau 'compare' (bandingkan dengan loader lama)
  const [activeTab, setActiveTab] = useState<'traditional' | 'compare'>('traditional')

  // Pilihan varian tradisional yang sedang aktif di playground (default: kendil gerabah)
  const [selectedVariant, setSelectedVariant] = useState<TraditionalLoaderVariant>('kendil')

  // State kontrol visual
  const [size, setSize] = useState<TraditionalLoaderProps['size']>('lg')
  const [theme, setTheme] = useState<'light' | 'dark' | 'glass'>('light')
  const [customText, setCustomText] = useState('Meracik Hidangan Tradisional...')
  const [customSubtext, setCustomSubtext] = useState(
    'Bumbu rempah meresap, disajikan hangat khas Pawon Hara'
  )
  const [showSteam, setShowSteam] = useState(true)
  const [showGlow, setShowGlow] = useState(true)
  const [showEmbers, setShowEmbers] = useState(true)
  const [showBrandBadge, setShowBrandBadge] = useState(true)

  // Fullscreen simulation state
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationStep, setSimulationStep] = useState(0)

  const simulationSteps = [
    {
      text: 'Menyiapkan Racikan Rempah...',
      subtext: 'Bumbu rempah Nusantara pilihan diulek segar di pawon...',
    },
    {
      text: 'Mengukus Hidangan Hangat...',
      subtext: 'Aroma sedap wangi alami siap disajikan untuk Anda...',
    },
    {
      text: 'Sugeng Rawuh ing Pawon Hara...',
      subtext: 'Menghidangkan rasa istimewa langsung ke meja Anda...',
    },
  ]

  const handleStartSimulation = () => {
    setIsSimulating(true)
    setSimulationStep(0)
  }

  useEffect(() => {
    if (!isSimulating) return

    const t1 = setTimeout(() => setSimulationStep(1), 1200)
    const t2 = setTimeout(() => setSimulationStep(2), 2400)
    const t3 = setTimeout(() => {
      setIsSimulating(false)
      setSimulationStep(0)
    }, 3800)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [isSimulating])

  // Data varian tradisional
  const traditionalVariants: {
    id: TraditionalLoaderVariant
    title: string
    subtitle: string
    badge: string
    description: string
    recommendedFor: string
  }[] = [
    {
      id: 'besek',
      title: 'Kukusan Anyaman Bambu & Besek',
      subtitle: 'Nasi Box Tradisional Nusantara',
      badge: 'Paling Cocok untuk HaraBox',
      description:
        'Siluet wadah besek anyaman bambu alami berpadu alas daun pisang dan tali serat janur. Uap wangi membubung dari celah anyaman bambu yang hangat dengan ritme napas alami.',
      recommendedFor: 'Catering, Nasi Kotak/Box, Tumpeng Tradisional',
    },
    {
      id: 'gunungan',
      title: 'Gunungan Wayang Kulit (Kayon)',
      subtitle: 'Adiluhung Budaya Keraton Jawa',
      badge: 'Megah & Luhur',
      description:
        'Siluet Gunungan Pohon Hayat & Gapura Kemakmuran khas wayang kulit Jawa. Diterangi pendaran cahaya keemasan lampu minyak Blencong yang temaram dengan ayunan tancep kayon.',
      recommendedFor: 'Event Budaya, Hajatan, Acara Akbar & Keraton',
    },
    {
      id: 'kendil',
      title: 'Kendil Gerabah & Tungku Kayu',
      subtitle: 'Dapur Pawon Tempo Doeloe',
      badge: '⭐ Aktif di Seluruh Aplikasi',
      description:
        'Kuali kendil tanah liat gerabah tradisional di atas bara kayu bakar yang berpijar hangat. Tutup kendil berayun lembut saat kaldu mendidih diiringi aroma rempah bunga lawang.',
      recommendedFor: 'Masakan Berkuah, Rawon, Gudeg, Sayur Lodeh',
    },
    {
      id: 'padma',
      title: 'Bunga Padma & Batik Melati',
      subtitle: 'Organik & Anggun (Bebas Roda Gigi)',
      badge: 'Artistik & Bersahaja',
      description:
        'Kelopak bunga teratai (padma) sakral dengan motif ceplok batik Jawa klasik yang mekar perlahan secara alami (breathing lotus), bukan putaran rotor mekanis.',
      recommendedFor: 'Paket VIP, Pernikahan, Jamuan Elegan',
    },
  ]

  return (
    <main className="min-h-screen bg-[#FBF7F2] text-[#2B120E] selection:bg-[#95271D] selection:text-white py-10 px-4 sm:px-8">
      {/* Fullscreen Simulation Active */}
      {isSimulating && (
        <TraditionalLoader
          fullScreen
          variant={selectedVariant}
          size="lg"
          theme={theme}
          text={simulationSteps[simulationStep].text}
          subtext={simulationSteps[simulationStep].subtext}
          showSteam={showSteam}
          showGlow={showGlow}
          showEmbers={showEmbers}
          showBrandBadge={showBrandBadge}
        />
      )}

      <div className="mx-auto max-w-6xl">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-amber-900/10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-50 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-amber-900 shadow-xs">
              <Sparkles size={13} className="text-[#B45309]" />
              Loader Tradisional Nusantara • Pawon Hara
            </div>
            <h1 className="mt-3 text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight font-dhaksinarga">
              Loader Tradisional <span className="text-[#95271D]">Pawon Hara</span>
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-zinc-600 max-w-2xl leading-relaxed">
              Loader lama roda cakra gear robotik telah resmi digantikan dengan konsep <strong>Kendil Gerabah & Tungku Kayu Bakar</strong> di seluruh halaman aplikasi.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/hc-admin"
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 shadow-xs transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              <ArrowLeft size={14} />
              Kembali ke Login
            </Link>
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#60241E] hover:bg-[#95271D] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition"
            >
              Halaman Menu
            </Link>
          </div>
        </div>

        {/* Status Alert: Telah Dipasang ke Seluruh Aplikasi */}
        <div className="mt-6 rounded-2xl border border-emerald-300/80 bg-gradient-to-r from-emerald-50 via-amber-50/50 to-orange-50/40 p-4.5 text-xs flex items-start gap-3 shadow-xs">
          <span className="text-xl">🍲</span>
          <div>
            <h4 className="font-bold text-emerald-950">Status: Resmi Aktif di Seluruh Aplikasi</h4>
            <p className="text-emerald-900/90 mt-0.5 leading-relaxed">
              Loader <strong>Kendil Gerabah Tradisional</strong> kini telah aktif di seluruh halaman (Beranda, Menu, Tentang Kami, Cara Pesan, Detail Produk, Tracking Order, Keranjang, Halaman Admin, dan Login). Roda gear mekanik telah 100% dipensiunkan!
            </p>
          </div>
        </div>

        {/* Tab Navigation: Pilihan Varian vs Perbandingan dengan Versi Lama */}
        <div className="mt-8 flex items-center gap-3 border-b border-zinc-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('traditional')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'traditional'
                ? 'bg-[#60241E] text-white shadow-sm'
                : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
            }`}
          >
            <Sparkles size={14} className={activeTab === 'traditional' ? 'text-amber-300' : ''} />
            <span>4 Konsep Tradisional Baru</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('compare')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'compare'
                ? 'bg-[#60241E] text-white shadow-sm'
                : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
            }`}
          >
            <Layers size={14} />
            <span>Bandingkan: Loader Lama (Robotik) vs Revisi</span>
          </button>
        </div>

        {/* TAB 1: 4 REVISI KONSEP TRADISIONAL */}
        {activeTab === 'traditional' && (
          <div className="mt-8 space-y-10">
            {/* Quick Selector Grid: 4 Pilihan Varian Tradisional */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <UtensilsCrossed size={16} className="text-[#95271D]" />
                  Pilih Konsep Tradisional untuk Diuji
                </h3>
                <span className="text-xs text-zinc-400 font-medium">
                  Klik kartu untuk mengganti tampilan di bawah
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {traditionalVariants.map((v) => {
                  const isSelected = selectedVariant === v.id
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v.id)}
                      className={`text-left p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'border-[#95271D] bg-white ring-2 ring-[#95271D]/20 shadow-md scale-[1.01]'
                          : 'border-zinc-200/90 bg-white/70 hover:bg-white hover:border-zinc-300 shadow-xs'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 text-[#95271D]">
                          <CheckCircle2 size={18} />
                        </div>
                      )}

                      <div>
                        <span
                          className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-3 ${
                            isSelected
                              ? 'bg-[#95271D] text-white'
                              : 'bg-amber-100/70 text-amber-900'
                          }`}
                        >
                          {v.badge}
                        </span>
                        <h4 className="text-sm font-black text-zinc-900 leading-snug">
                          {v.title}
                        </h4>
                        <p className="text-[11px] font-medium text-amber-800/80 mt-0.5">
                          {v.subtitle}
                        </p>
                        <p className="text-xs text-zinc-500 mt-2.5 leading-relaxed line-clamp-3">
                          {v.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Cocok untuk:</span>
                        <span className="font-bold text-zinc-700 truncate max-w-[130px]">
                          {v.recommendedFor}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Interactive Simulation Hero Banner */}
            <div className="rounded-3xl bg-gradient-to-r from-[#60241E] via-[#95271D] to-[#E77B49] p-6 sm:p-8 text-white shadow-xl shadow-[#60241E]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <span className="rounded-full bg-white/20 border border-white/30 px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                  Uji Fullscreen Layar Penuh
                </span>
                <h2 className="mt-2 text-2xl font-black tracking-tight font-dhaksinarga">
                  Simulasi Loader Tradisional ({traditionalVariants.find((v) => v.id === selectedVariant)?.title})
                </h2>
                <p className="text-xs sm:text-sm text-amber-100/90 mt-1 max-w-xl leading-relaxed">
                  Rasakan transisi halaman penuh selama 3.8 detik seperti yang akan dilihat pelanggan
                  saat memesan catering atau login ke Pawon Hara.
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartSimulation}
                className="inline-flex shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-[#F59E0B] hover:bg-amber-400 text-[#1C0B09] px-6 py-4 text-xs sm:text-sm font-black shadow-lg transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Play size={16} className="fill-[#1C0B09] text-[#1C0B09]" />
                <span>Mulai Simulasi Layar Penuh</span>
              </button>
            </div>

            {/* Main Playground: Control Panel (Left) & Live Canvas (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Controls Panel (Col 5) */}
              <div className="lg:col-span-5 rounded-[2rem] border border-amber-900/10 bg-white p-6 sm:p-7 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                  <h3 className="text-base font-black text-zinc-950 flex items-center gap-2">
                    <Layers size={18} className="text-[#95271D]" />
                    Pengaturan Loader
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVariant('besek')
                      setSize('lg')
                      setTheme('light')
                      setCustomText('Meracik Hidangan Tradisional...')
                      setCustomSubtext('Bumbu rempah meresap, disajikan hangat khas Pawon Hara')
                      setShowSteam(true)
                      setShowGlow(true)
                      setShowEmbers(true)
                      setShowBrandBadge(true)
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
                    Tema Latar Belakang
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'light', label: 'Terang Pawon', icon: Sun },
                      { id: 'dark', label: 'Temaram Gelap', icon: Moon },
                      { id: 'glass', label: 'Kaca Keraton', icon: Sparkles },
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
                              ? 'border-[#95271D] bg-red-50/70 text-[#95271D] shadow-xs'
                              : 'border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-100'
                          }`}
                        >
                          <Icon
                            size={16}
                            className={isSelected ? 'text-[#95271D]' : 'text-zinc-400'}
                          />
                          <span className="mt-1">{t.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 2. Size Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                    Ukuran Loader
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
                            ? 'border-[#60241E] bg-[#60241E] text-white shadow-xs'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Text Customization */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Teks Status Utama
                    </label>
                    <input
                      type="text"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="Contoh: Meracik Hidangan Tradisional..."
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-900 outline-none focus:border-[#95271D] focus:bg-white transition"
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
                      placeholder="Contoh: Bumbu rempah meresap..."
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-900 outline-none focus:border-[#95271D] focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* 4. Effect Toggles */}
                <div className="pt-2 border-t border-zinc-100 space-y-2.5">
                  <label className="flex items-center justify-between text-xs font-bold text-zinc-700 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Wind size={14} className="text-amber-700" />
                      Kepulan Uap Hangat Alami
                    </span>
                    <input
                      type="checkbox"
                      checked={showSteam}
                      onChange={(e) => setShowSteam(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#95271D] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs font-bold text-zinc-700 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Flame size={14} className="text-orange-600" />
                      Pendaran Hangat Tungku / Blencong
                    </span>
                    <input
                      type="checkbox"
                      checked={showGlow}
                      onChange={(e) => setShowGlow(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#95271D] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs font-bold text-zinc-700 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Sparkles size={14} className="text-amber-500" />
                      Partikel Rempah / Abu Melayang
                    </span>
                    <input
                      type="checkbox"
                      checked={showEmbers}
                      onChange={(e) => setShowEmbers(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#95271D] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs font-bold text-zinc-700 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <span className="text-amber-700 font-bold">❧</span>
                      Pita Ornamen Brand Pawon Hara
                    </span>
                    <input
                      type="checkbox"
                      checked={showBrandBadge}
                      onChange={(e) => setShowBrandBadge(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#95271D] cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Live Canvas Preview (Col 7) */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                {/* The Stage */}
                <div
                  className={`relative overflow-hidden rounded-[2.5rem] border transition-colors duration-500 p-12 min-h-[480px] flex items-center justify-center ${
                    theme === 'dark'
                      ? 'bg-[#1C0B09] border-stone-800 shadow-2xl shadow-black/50 text-[#FAF5EE]'
                      : theme === 'glass'
                      ? 'bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 border-amber-200/80 shadow-xl'
                      : 'bg-[#FDFBF7] border-amber-900/10 shadow-xl shadow-zinc-950/5 text-[#2B120E]'
                  }`}
                >
                  {/* Decorative Stage Grid / Ambient Lights */}
                  <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-red-500/10 blur-3xl" />

                  {/* Badges on stage top */}
                  <div className="absolute top-5 left-6 text-[11px] font-black uppercase tracking-wider text-amber-800/80 flex items-center gap-1.5">
                    <span>❧</span>
                    <span>
                      Varian:{' '}
                      {traditionalVariants.find((v) => v.id === selectedVariant)?.title}
                    </span>
                  </div>

                  <div className="absolute top-5 right-6 flex items-center gap-1.5 rounded-full bg-black/5 dark:bg-white/10 px-3 py-1 text-[10px] font-bold text-zinc-500">
                    <Eye size={12} />
                    <span>Mode: {theme}</span>
                  </div>

                  {/* The Star: TraditionalLoader Component */}
                  <TraditionalLoader
                    variant={selectedVariant}
                    size={size}
                    theme={theme}
                    text={customText}
                    subtext={customSubtext}
                    showSteam={showSteam}
                    showGlow={showGlow}
                    showEmbers={showEmbers}
                    showBrandBadge={showBrandBadge}
                  />
                </div>

                {/* Card Mockup Context Preview (e.g. Inside Modal or Checkout Box) */}
                <div className="rounded-[2rem] border border-amber-900/10 bg-white p-6 sm:p-8 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#95271D] mb-1">
                    <Flame size={14} />
                    Konteks Penggunaan: Dialog / Box Pesanan
                  </div>
                  <h3 className="text-lg font-black text-zinc-950 font-dhaksinarga">
                    Tampilan di Dalam Modal / Card Pesanan
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 mb-6">
                    Simulasi saat loader muncul di dalam kartu status tanpa mengambil alih seluruh
                    layar.
                  </p>

                  <div className="mx-auto max-w-sm rounded-3xl border border-amber-900/10 bg-[#FAF6EE] p-8 shadow-sm">
                    <TraditionalLoader
                      variant={selectedVariant}
                      size="md"
                      theme="light"
                      text="Memverifikasi Pesanan..."
                      subtext="Menghubungkan ke Pawon Hara"
                      showSteam={true}
                      showGlow={false}
                      showEmbers={true}
                      showBrandBadge={true}
                    />
                  </div>
                </div>

                {/* Cara Memasang Nanti (Saat Sudah Disetujui) */}
                <div className="rounded-[2rem] border border-zinc-200 bg-zinc-950 p-6 text-white font-mono text-xs shadow-md">
                  <div className="flex items-center justify-between text-zinc-400 mb-3 border-b border-zinc-800 pb-2">
                    <span className="font-bold text-zinc-300">
                      Cara Pasang (Saat Anda Siap Memasang):
                    </span>
                    <span className="text-[10px] bg-amber-950 border border-amber-800/80 px-2 py-0.5 rounded text-amber-300">
                      Tersimpan Aman di components/ui/TraditionalLoader.tsx
                    </span>
                  </div>
                  <pre className="text-amber-200/90 overflow-x-auto leading-relaxed">
{`// Cukup import TraditionalLoader:
import TraditionalLoader from '@/components/ui/TraditionalLoader'

// 1. Opsi Varian Besek Nasi Box:
<TraditionalLoader variant="besek" text="Menyiapkan Hidangan..." />

// 2. Opsi Varian Gunungan Wayang Kulit:
<TraditionalLoader variant="gunungan" text="Memuat Halaman..." />

// 3. Opsi Varian Kendil Gerabah:
<TraditionalLoader variant="kendil" text="Meracik Masakan..." />`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BANDINGKAN DENGAN LOADER LAMA (ROBOTIK) */}
        {activeTab === 'compare' && (
          <div className="mt-8 space-y-8">
            <div className="rounded-3xl border border-red-200 bg-red-50/60 p-6 text-xs text-red-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-red-950 flex items-center gap-2">
                  <span>🤖 Kenapa Loader Lama Kelihatan Seperti Robot?</span>
                </h3>
                <ul className="mt-2 space-y-1 text-red-900/85 list-disc list-inside">
                  <li>
                    <strong>Putaran Cakra Gigi Searah & Berlawanan</strong>: Dua lingkaran SVG
                    bergerigi/bergaris putus-putus berputar kebalikan arah menyerupai mesin roda gigi
                    (planetary gears) atau reaktor sci-fi.
                  </li>
                  <li>
                    <strong>Garis Jari-Jari (Ray Spokes) & Lingkaran Geometris Kaku</strong>:
                    Menciptakan kesan HUD radar penargetan / scanner digital daripada kerajinan
                    tangan.
                  </li>
                  <li>
                    <strong>Titik LED Linier</strong>: Garis titik bawah berkedip mirip indikator
                    baterai / digital LED loader.
                  </li>
                </ul>
              </div>

              <div className="shrink-0 bg-white/80 rounded-2xl p-4 border border-red-200 text-center">
                <span className="text-xs font-bold text-red-900 block">Solusi Revisi Baru:</span>
                <span className="text-[11px] text-zinc-600 block mt-0.5">
                  Menghilangkan roda gigi mekanik, menggantinya dengan tekstur anyaman bambu, uap
                  organik, atau wayang kulit.
                </span>
              </div>
            </div>

            {/* Perbandingan Head-to-Head */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Kolom Kiri: Loader Lama */}
              <div className="rounded-[2.5rem] border border-zinc-200 bg-white p-8 flex flex-col items-center justify-between min-h-[460px] text-center shadow-xs">
                <div className="w-full flex items-center justify-between text-xs pb-4 border-b border-zinc-100">
                  <span className="font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                    Versi Lama (Kritik: Mirip Robot)
                  </span>
                  <span className="text-zinc-400 text-[11px]">Cakra Berputar Mekanis</span>
                </div>

                <div className="py-6 flex items-center justify-center">
                  <LogoSpinner
                    size="md"
                    theme="light"
                    text="Memproses Hidangan..."
                    subtext="Putaran cakra geometris dengan garis putus-putus"
                    showRipples={true}
                    showGlow={true}
                    showProgressBar={true}
                  />
                </div>

                <div className="w-full pt-4 border-t border-zinc-100 text-[11px] text-zinc-500">
                  <span className="font-semibold text-zinc-700">Analisis:</span> Putaran roda cakra
                  kontra-arah memberikan ilusi mekanis / roda gigi turbin pabrik.
                </div>
              </div>

              {/* Kolom Kanan: Revisi Baru (Contoh: Besek Nasi Bambu) */}
              <div className="rounded-[2.5rem] border-2 border-[#95271D] bg-[#FFFDF9] p-8 flex flex-col items-center justify-between min-h-[460px] text-center shadow-lg shadow-[#95271D]/10">
                <div className="w-full flex items-center justify-between text-xs pb-4 border-b border-amber-900/10">
                  <span className="font-bold text-[#95271D] bg-amber-50 border border-amber-300 px-3 py-1 rounded-full">
                    Revisi Baru (Otentik Nusantara)
                  </span>
                  <span className="text-amber-800 font-bold text-[11px]">Anyaman Bambu & Uap</span>
                </div>

                <div className="py-6 flex items-center justify-center">
                  <TraditionalLoader
                    variant="besek"
                    size="md"
                    theme="light"
                    text="Meracik Hidangan Pawon..."
                    subtext="Anyaman bambu alami berpadu uap rempah hangat"
                    showSteam={true}
                    showGlow={true}
                    showEmbers={true}
                    showBrandBadge={true}
                  />
                </div>

                <div className="w-full pt-4 border-t border-amber-900/10 text-[11px] text-amber-900">
                  <span className="font-semibold text-[#95271D]">Karakteristik Baru:</span> Tanpa
                  roda gigi, gerakan napas lembut, uap mengepul dari wadah besek bambu alami.
                </div>
              </div>
            </div>

            {/* Galeri Ke-4 Varian Bersandingan */}
            <div className="mt-12">
              <h3 className="text-base font-black text-zinc-950 mb-4 font-dhaksinarga flex items-center gap-2">
                <span>❧</span>
                <span>Semua 4 Varian Tradisional Bersandingan</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {traditionalVariants.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-3xl border border-amber-900/10 bg-white p-6 flex flex-col items-center justify-between text-center shadow-xs"
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full mb-4">
                      {v.title}
                    </span>

                    <div className="py-2">
                      <TraditionalLoader
                        variant={v.id}
                        size="sm"
                        theme="light"
                        text=""
                        subtext=""
                        showSteam={true}
                        showGlow={false}
                        showEmbers={false}
                        showBrandBadge={false}
                      />
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-100 w-full">
                      <p className="text-xs font-bold text-zinc-900">{v.subtitle}</p>
                      <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">
                        {v.description}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVariant(v.id)
                          setActiveTab('traditional')
                        }}
                        className="mt-3 w-full py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#95271D] text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Uji Varian Ini</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
