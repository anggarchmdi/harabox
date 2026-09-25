import { useThemeStore } from '../../stores/theme.store'
import PawonHaraImg from '../../assets/PawonHara.webp'

export type TraditionalLoaderVariant = 'besek' | 'gunungan' | 'kendil' | 'padma'

export interface TraditionalLoaderProps {
  /** Variant of the traditional loader:
   * - 'besek': Kukusan anyaman bambu & wadah besek nasi hangat khas Nusantara
   * - 'gunungan': Gunungan Kayon wayang kulit Jawa dengan pendaran lampu blencong
   * - 'kendil': Kendil gerabah tanah liat tradisional di atas tungku bara rempah
   * - 'padma': Bunga teratai keraton mekar anggun (breathing lotus) bebas dari roda gear
   */
  variant?: TraditionalLoaderVariant
  /** Ukuran loader */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Tema tampilan visual */
  theme?: 'light' | 'dark' | 'glass'
  /** Teks status utama */
  text?: string
  /** Subteks keterangan */
  subtext?: string
  /** Tampilkan kepulan uap hangat pawon */
  showSteam?: boolean
  /** Tampilkan pendaran hangat bara tungku / lampu blencong */
  showGlow?: boolean
  /** Tampilkan butir rempah / partikel hangat melayang */
  showEmbers?: boolean
  /** Tampilkan pita brand Pawon Hara berornamen tradisional */
  showBrandBadge?: boolean
  /** Mode fullscreen dengan backdrop overlay */
  fullScreen?: boolean
  /** CSS class tambahan */
  className?: string
}

/* ==========================================================================
   1. ORNAMEN UAP HANGAT ALAMI (ORGANIC STEAM)
   ========================================================================== */
function OrganicSteam({ isLight }: { isLight: boolean }) {
  const steamStroke = isLight ? '#B45309' : '#F59E0B'

  return (
    <div className="pointer-events-none absolute -top-8 sm:-top-10 left-1/2 -translate-x-1/2 flex items-end justify-center gap-2.5 z-20">
      {/* Liukan Uap Kiri */}
      <svg
        className="w-3.5 h-8 animate-steam-1 filter blur-[0.4px]"
        viewBox="0 0 14 36"
        fill="none"
      >
        <path
          d="M 7 36 C 2 24, 12 16, 7 8 C 4 4, 9 2, 7 0"
          stroke={steamStroke}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />
      </svg>

      {/* Liukan Uap Tengah (Lebih Tinggi & Hangat) */}
      <svg
        className="w-4 h-11 animate-steam-2 filter blur-[0.3px]"
        viewBox="0 0 16 44"
        fill="none"
      >
        <path
          d="M 8 44 C 14 32, 2 22, 9 10 C 13 4, 6 2, 8 0"
          stroke={isLight ? '#EA580C' : '#FBBF24'}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />
      </svg>

      {/* Liukan Uap Kanan */}
      <svg
        className="w-3.5 h-8 animate-steam-3 filter blur-[0.4px]"
        viewBox="0 0 14 36"
        fill="none"
      >
        <path
          d="M 7 36 C 4 25, 11 17, 6 8 C 3 4, 8 2, 7 0"
          stroke={steamStroke}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />
      </svg>
    </div>
  )
}

/* ==========================================================================
   2. PARTIKEL BARA / REMPAH HANGAT MELAYANG (AROMATIC EMBERS)
   ========================================================================== */
function FloatingAromaticEmbers({ isLight }: { isLight: boolean }) {
  const emberColor = isLight ? 'bg-amber-600' : 'bg-amber-400'

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <span
        className={`absolute bottom-3 left-4 w-1.5 h-1.5 rounded-full ${emberColor} shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-ember-1`}
      />
      <span
        className={`absolute bottom-5 right-5 w-2 h-2 rounded-full ${emberColor} shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-ember-2`}
      />
      <span
        className={`absolute bottom-2 left-1/2 w-1.5 h-1.5 rounded-full ${emberColor} shadow-[0_0_8px_rgba(234,88,12,0.8)] animate-ember-3`}
      />
    </div>
  )
}

/* ==========================================================================
   3. ILUSTRASI KUKUSAN ANYAMAN BAMBU & BESEK TRADISIONAL (BESEK)
   ========================================================================== */
function BesekBambuIllustration({ isLight }: { isLight: boolean }) {
  const primaryBamboo = isLight ? '#C2782A' : '#E8A54C'
  const secondaryBamboo = isLight ? '#8C4D15' : '#C2782A'
  const weaveHighlight = isLight ? '#FDE68A' : '#FDF0CD'
  const leafColor = isLight ? '#2E6627' : '#3F8636'

  return (
    <div className="relative w-full h-full flex items-center justify-center animate-bamboo-breathe">
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-[0_8px_20px_rgba(140,77,21,0.25)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Pola Anyaman Bambu Sasak Tradisional */}
          <pattern
            id="woven-bamboo-pattern"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <rect width="10" height="10" fill={primaryBamboo} />
            <rect x="10" y="10" width="10" height="10" fill={primaryBamboo} />
            <rect x="10" y="0" width="10" height="10" fill={secondaryBamboo} />
            <rect x="0" y="10" width="10" height="10" fill={secondaryBamboo} />
            <line
              x1="0"
              y1="0"
              x2="10"
              y2="10"
              stroke={weaveHighlight}
              strokeWidth="0.8"
              opacity="0.4"
            />
            <line
              x1="10"
              y1="10"
              x2="20"
              y2="20"
              stroke={weaveHighlight}
              strokeWidth="0.8"
              opacity="0.4"
            />
          </pattern>

          {/* Gradien Daun Pisang Pelapis Bawah */}
          <linearGradient id="banana-leaf-grad" x1="0" y1="0" x2="200" y2="200">
            <stop offset="0%" stopColor={leafColor} />
            <stop offset="50%" stopColor="#1E461A" />
            <stop offset="100%" stopColor={leafColor} />
          </linearGradient>

          {/* Gradien Tali Serat Janur Pengikat */}
          <linearGradient id="janur-grad" x1="0" y1="0" x2="0" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>

        {/* 1. Daun Pisang Tradisional Segar di Bawah Wadah Besek */}
        <path
          d="M 28 135 C 10 110, 20 65, 55 45 C 80 30, 120 30, 145 45 C 180 65, 190 110, 172 135 C 150 168, 50 168, 28 135 Z"
          fill="url(#banana-leaf-grad)"
          opacity="0.85"
        />
        {/* Tulang Daun Pisang */}
        <path
          d="M 100 40 C 100 70, 100 130, 100 160"
          stroke="#4ADE80"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.4"
        />
        {/* Serat Melintang Daun Pisang */}
        {[-30, -15, 0, 15, 30, 45].map((y) => (
          <path
            key={y}
            d={`M 55 ${100 + y} Q 100 ${95 + y} 145 ${100 + y}`}
            stroke="#4ADE80"
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.25"
          />
        ))}

        {/* 2. Badan Wadah Besek Anyaman Bambu (Hexagonal/Rounded Box Tradisional) */}
        <rect
          x="44"
          y="52"
          width="112"
          height="102"
          rx="18"
          fill="url(#woven-bamboo-pattern)"
          stroke={secondaryBamboo}
          strokeWidth="3"
        />

        {/* 3. Lis Bilah Bambu Penguat Tepi (Bambu Kulit Alami) */}
        <rect
          x="40"
          y="48"
          width="120"
          height="110"
          rx="20"
          fill="none"
          stroke={secondaryBamboo}
          strokeWidth="2.5"
          strokeDasharray="8 3"
        />
        <rect
          x="43"
          y="51"
          width="114"
          height="104"
          rx="18"
          fill="none"
          stroke={weaveHighlight}
          strokeWidth="1"
          opacity="0.6"
        />

        {/* 4. Tali Serat Janur Tradisional Melintang Silang (Pengikat Besek) */}
        {/* Tali Vertikal */}
        <path
          d="M 97 46 L 97 160"
          stroke="url(#janur-grad)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 100 48 L 100 158"
          stroke="#FEF3C7"
          strokeWidth="1.2"
          strokeDasharray="2 3"
        />

        {/* Tali Horizontal */}
        <path
          d="M 38 100 L 162 100"
          stroke="url(#janur-grad)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 40 100 L 160 100"
          stroke="#FEF3C7"
          strokeWidth="1.2"
          strokeDasharray="2 3"
        />

        {/* 5. Simpul Daun Janur Tradisional di Tengah */}
        <circle cx="100" cy="100" r="16" fill={secondaryBamboo} stroke="#F59E0B" strokeWidth="2.5" />
        <path
          d="M 88 100 C 92 88, 108 88, 112 100 C 108 112, 92 112, 88 100 Z"
          fill="#F59E0B"
        />
        <circle cx="100" cy="100" r="4.5" fill="#FFFBEB" />

        {/* Butiran Beras/Rempah Berkah di Sudut Wadah */}
        <circle cx="62" cy="70" r="2" fill={weaveHighlight} opacity="0.9" />
        <circle cx="138" cy="70" r="2" fill={weaveHighlight} opacity="0.9" />
        <circle cx="62" cy="136" r="2" fill={weaveHighlight} opacity="0.9" />
        <circle cx="138" cy="136" r="2" fill={weaveHighlight} opacity="0.9" />
      </svg>

      {/* Cap Stempel Pawon Hara di Pusat Besek */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-12 h-12 rounded-full bg-amber-950/85 border-2 border-amber-300/80 p-2 shadow-inner flex items-center justify-center">
          <img
            src={PawonHaraImg}
            alt="Pawon Hara Stamp"
            className="w-8 h-8 object-contain drop-shadow"
          />
        </div>
      </div>
    </div>
  )
}

/* ==========================================================================
   4. ILUSTRASI GUNUNGAN WAYANG KULIT KERATON (KAYON ADILUHUNG)
   ========================================================================== */
function GununganWayangIllustration({ isLight }: { isLight: boolean }) {
  const goldPrimary = isLight ? '#B45309' : '#F59E0B'
  const goldBright = isLight ? '#D97706' : '#FDE68A'
  const silhouetteFill = isLight ? '#FFFDF9' : '#230E0B'
  const strokeLine = isLight ? '#78350F' : '#FBBF24'

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Pendaran Cahaya Lampu Minyak Blencong Wayang Kulit di Belakang Kelir */}
      <div className="pointer-events-none absolute inset-0 -top-2 flex items-center justify-center">
        <div
          className={`w-36 h-48 rounded-full blur-2xl animate-blencong-flicker ${
            isLight ? 'bg-amber-300/60' : 'bg-[#F59E0B]/35'
          }`}
        />
        <div
          className={`w-28 h-36 rounded-full blur-xl animate-hearth-glow ${
            isLight ? 'bg-orange-300/50' : 'bg-[#95271D]/45'
          }`}
        />
      </div>

      {/* Siluet Gunungan yang Berayun Halus Bersahaja (Wayang Tancep Kayon) */}
      <div className="relative z-10 w-full h-full flex items-center justify-center animate-gunungan-sway">
        <svg
          viewBox="0 0 180 220"
          className="w-full h-full drop-shadow-[0_10px_25px_rgba(180,83,9,0.3)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradien Emas Keraton untuk Batang & Sayap Hayat */}
            <linearGradient id="gunungan-gold" x1="0" y1="0" x2="0" y2="100%">
              <stop offset="0%" stopColor={goldBright} />
              <stop offset="60%" stopColor={goldPrimary} />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>

            {/* Gradien Tubuh Utama Kayon Wayang */}
            <linearGradient id="kayon-body" x1="90" y1="10" x2="90" y2="210">
              <stop offset="0%" stopColor={isLight ? '#FEF3C7' : '#3E1512'} />
              <stop offset="50%" stopColor={silhouetteFill} />
              <stop offset="100%" stopColor={isLight ? '#FDE68A' : '#1C0B09'} />
            </linearGradient>
          </defs>

          {/* 1. Siluet Daun Utama Gunungan / Kayon Jawa Klasik */}
          <path
            d="M 90 12 
               C 98 32, 126 58, 142 84 
               C 158 110, 156 142, 144 165 
               C 134 182, 116 190, 90 192 
               C 64 190, 46 182, 36 165 
               C 24 142, 22 110, 38 84 
               C 54 58, 82 32, 90 12 Z"
            fill="url(#kayon-body)"
            stroke={strokeLine}
            strokeWidth="2.8"
            strokeLinejoin="round"
          />

          {/* Bingkai Ukiran Dalam Gunungan */}
          <path
            d="M 90 24 
               C 96 42, 120 65, 134 88 
               C 148 112, 146 138, 136 158 
               C 126 174, 110 180, 90 182 
               C 70 180, 54 174, 44 158 
               C 34 138, 32 112, 46 88 
               C 60 65, 84 42, 90 24 Z"
            fill="none"
            stroke={goldPrimary}
            strokeWidth="1.2"
            strokeDasharray="4 2"
            opacity="0.8"
          />

          {/* 2. Gapura Keraton / Candi Bentar di Kaki Gunungan */}
          <path
            d="M 72 186 L 72 144 C 72 134, 108 134, 108 144 L 108 186 Z"
            fill={isLight ? '#F59E0B' : '#78350F'}
            stroke={strokeLine}
            strokeWidth="1.8"
          />
          {/* Pintu Gerbang Kemakmuran */}
          <path
            d="M 80 186 L 80 154 C 80 148, 100 148, 100 154 L 100 186 Z"
            fill={isLight ? '#FFFBEB' : '#2D120F'}
            stroke={strokeLine}
            strokeWidth="1.2"
          />
          {/* Tangga Gerbang */}
          <line x1="68" y1="188" x2="112" y2="188" stroke={strokeLine} strokeWidth="2.5" />
          <line x1="64" y1="192" x2="116" y2="192" stroke={strokeLine} strokeWidth="3" />

          {/* 3. Pohon Hayat (Tree of Life) Menjulang dari Atap Gapura */}
          <line
            x1="90"
            y1="134"
            x2="90"
            y2="30"
            stroke="url(#gunungan-gold)"
            strokeWidth="2.6"
            strokeLinecap="round"
          />

          {/* Cabang-Cabang Sulur Hayat Kiri & Kanan */}
          {/* Cabang Bawah */}
          <path
            d="M 90 120 C 70 115, 55 105, 52 90 C 58 85, 75 92, 90 102"
            fill="none"
            stroke="url(#gunungan-gold)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M 90 120 C 110 115, 125 105, 128 90 C 122 85, 105 92, 90 102"
            fill="none"
            stroke="url(#gunungan-gold)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Cabang Tengah */}
          <path
            d="M 90 85 C 74 80, 62 72, 60 58 C 66 54, 80 60, 90 68"
            fill="none"
            stroke="url(#gunungan-gold)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M 90 85 C 106 80, 118 72, 120 58 C 114 54, 100 60, 90 68"
            fill="none"
            stroke="url(#gunungan-gold)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Daun-daun Sulur Buncap */}
          <circle cx="52" cy="88" r="3.2" fill={goldBright} />
          <circle cx="128" cy="88" r="3.2" fill={goldBright} />
          <circle cx="60" cy="56" r="2.8" fill={goldBright} />
          <circle cx="120" cy="56" r="2.8" fill={goldBright} />
          <circle cx="90" cy="24" r="3.5" fill={goldBright} />

          {/* 4. Tangkai Pegangan Kayon Wayang (Gapit Bambu/Tanduk Kerbau) */}
          <path
            d="M 90 192 L 90 216"
            stroke={isLight ? '#78350F' : '#F59E0B'}
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <circle cx="90" cy="216" r="3" fill="#D97706" />
        </svg>

        {/* Emblem Pawon Hara di Pusat Pohon Hayat */}
        <div className="absolute top-[82px] flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-amber-950/90 border border-amber-300/80 p-1.5 shadow-lg flex items-center justify-center">
            <img
              src={PawonHaraImg}
              alt="Pawon Hara"
              className="w-7 h-7 object-contain drop-shadow"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ==========================================================================
   5. ILUSTRASI KENDIL GERABAH & TUNGKU KAYU BAKAR (KENDIL)
   ========================================================================== */
function KendilGerabahIllustration({ isLight }: { isLight: boolean }) {
  const potClay = isLight ? '#9A3412' : '#C2410C'
  const potDarkClay = isLight ? '#7C2D12' : '#9A3412'
  const fireOrange = '#EA580C'
  const fireYellow = '#FBBF24'

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Bara Api Kayu Bakar Tungku Pawon di Bagian Bawah */}
      <div className="pointer-events-none absolute bottom-1 flex items-center justify-center gap-1.5 z-0">
        <div className="w-20 h-7 rounded-full bg-gradient-to-t from-red-600/50 via-amber-500/40 to-transparent blur-md animate-hearth-glow" />
      </div>

      <svg
        viewBox="0 0 190 190"
        className="w-full h-full relative z-10 drop-shadow-[0_8px_20px_rgba(154,52,18,0.3)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradien Tanah Liat Gerabah Tradisional */}
          <linearGradient id="clay-gradient" x1="30" y1="50" x2="160" y2="150">
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="35%" stopColor={potClay} />
            <stop offset="100%" stopColor={potDarkClay} />
          </linearGradient>

          {/* Gradien Tutup Kendil */}
          <linearGradient id="lid-gradient" x1="45" y1="40" x2="145" y2="70">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="100%" stopColor={potDarkClay} />
          </linearGradient>

          {/* Gradien Kayu Bakar */}
          <linearGradient id="wood-gradient" x1="0" y1="0" x2="100%" y2="0">
            <stop offset="0%" stopColor="#451A03" />
            <stop offset="50%" stopColor="#78350F" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>
        </defs>

        {/* 1. Kayu Bakar Tradisional di Dasar Tungku */}
        <rect
          x="35"
          y="152"
          width="120"
          height="12"
          rx="5"
          fill="url(#wood-gradient)"
          stroke="#291102"
          strokeWidth="1.5"
          transform="rotate(-4 95 158)"
        />
        <rect
          x="40"
          y="156"
          width="110"
          height="11"
          rx="4.5"
          fill="url(#wood-gradient)"
          stroke="#291102"
          strokeWidth="1.5"
          transform="rotate(3 95 161)"
        />

        {/* Lidah Api Bara Tungku Kayu */}
        <path
          d="M 68 154 Q 74 136 78 152 Q 86 130 92 152 Q 98 134 104 152 Q 112 138 120 154 Z"
          fill={fireYellow}
          opacity="0.85"
          className="animate-hearth-glow"
        />
        <path
          d="M 76 156 Q 84 140 88 154 Q 96 142 102 156 Z"
          fill={fireOrange}
          opacity="0.9"
        />

        {/* 2. Badan Kendil Gerabah (Belly of the Earthenware Pot) */}
        <path
          d="M 52 74 
             C 32 94, 30 134, 56 148 
             C 74 158, 116 158, 134 148 
             C 160 134, 158 94, 138 74 
             Z"
          fill="url(#clay-gradient)"
          stroke={potDarkClay}
          strokeWidth="2.5"
        />

        {/* Bibir / Leher Kendil */}
        <ellipse
          cx="95"
          cy="74"
          rx="45"
          ry="9"
          fill={potDarkClay}
          stroke="#FDBA74"
          strokeWidth="1.2"
        />

        {/* Kupingan / Gagang Gerabah Kiri & Kanan */}
        <path
          d="M 38 90 C 26 95, 26 112, 38 116"
          stroke={potDarkClay}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 152 90 C 164 95, 164 112, 152 116"
          stroke={potDarkClay}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Ornamen Goresan Ukir Tradisional Gerabah (Tali Air Bumi) */}
        <path
          d="M 46 112 Q 95 125 144 112"
          stroke="#FDBA74"
          strokeWidth="2"
          strokeDasharray="4 3"
          fill="none"
          opacity="0.75"
        />
        <path
          d="M 54 124 Q 95 136 136 124"
          stroke="#FDBA74"
          strokeWidth="1.4"
          fill="none"
          opacity="0.6"
        />

        {/* 3. Tutup Kendil yang Mendidih Pelan (Gentle Simmering Lid) */}
        <g className="animate-kendil-simmer">
          {/* Piring Tutup */}
          <path
            d="M 50 72 C 50 60, 140 60, 140 72 Z"
            fill="url(#lid-gradient)"
            stroke={potDarkClay}
            strokeWidth="2"
          />
          {/* Kenop Pegangan Tutup */}
          <ellipse cx="95" cy="56" rx="9" ry="6" fill="#F97316" stroke={potDarkClay} strokeWidth="1.5" />
          <circle cx="95" cy="54" r="3" fill="#FED7AA" />
        </g>

        {/* Bunga Lawang (Star Anise) & Cengkeh di Samping Kendil */}
        {/* Rempah Kiri: Bunga Lawang */}
        <g transform="translate(24, 138) scale(0.65)">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <ellipse
              key={deg}
              cx="14"
              cy="14"
              rx="6"
              ry="2.5"
              fill="#78350F"
              transform={`rotate(${deg} 14 14)`}
            />
          ))}
          <circle cx="14" cy="14" r="3" fill="#D97706" />
        </g>

        {/* Rempah Kanan: Cengkeh & Kayu Manis */}
        <g transform="translate(150, 138) scale(0.7)">
          <line x1="8" y1="2" x2="8" y2="18" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
          <circle cx="8" cy="2" r="3" fill="#D97706" />
        </g>
      </svg>

      {/* Cap Logo Pawon Hara di Lambung Kendil */}
      <div className="absolute top-[88px] flex items-center justify-center pointer-events-none">
        <div className="w-10 h-10 rounded-full bg-amber-950/85 border border-amber-300/80 p-1.5 shadow-md flex items-center justify-center">
          <img
            src={PawonHaraImg}
            alt="Pawon Hara"
            className="w-7 h-7 object-contain drop-shadow"
          />
        </div>
      </div>
    </div>
  )
}

/* ==========================================================================
   6. ILUSTRASI KELOPAK PADMA KERATON (BREATHING LOTUS - BEBAS GEAR)
   ========================================================================== */
function PadmaKeratonIllustration({ isLight }: { isLight: boolean }) {
  const petalStroke = isLight ? '#B45309' : '#F59E0B'
  const petalFill = isLight ? '#FEF3C7' : '#451A03'
  const innerPetalFill = isLight ? '#FDE68A' : '#78350F'

  // Delapan kelopak sakral bunga teratai Jawa (mekar bernapas secara organik)
  const angles = [0, 45, 90, 135, 180, 225, 270, 315]

  return (
    <div className="relative w-full h-full flex items-center justify-center animate-padma-bloom">
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-[0_8px_20px_rgba(217,119,6,0.3)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Pendaran Inti Teratai */}
          <radialGradient id="padma-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#78350F" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Kelopak Luar Padma Bunga Teratai */}
        {angles.map((angle) => (
          <g key={`outer-petal-${angle}`} transform={`rotate(${angle} 100 100)`}>
            <path
              d="M 100 18 
                 C 114 42, 122 74, 100 92 
                 C 78 74, 86 42, 100 18 Z"
              fill={petalFill}
              stroke={petalStroke}
              strokeWidth="2.2"
              strokeLinejoin="round"
              opacity="0.9"
            />
            {/* Urat Kelopak Tradisional */}
            <path
              d="M 100 24 L 100 84"
              stroke={petalStroke}
              strokeWidth="1.2"
              strokeDasharray="3 3"
              opacity="0.7"
            />
            {/* Cecek Titik Emas di Pucuk Kelopak */}
            <circle cx="100" cy="36" r="2.2" fill="#F59E0B" />
          </g>
        ))}

        {/* 2. Kelopak Lapis Dalam (Berselang 22.5 Derajat) */}
        {angles.map((angle) => (
          <g key={`inner-petal-${angle}`} transform={`rotate(${angle + 22.5} 100 100)`}>
            <path
              d="M 100 36 
                 C 110 52, 116 76, 100 88 
                 C 84 76, 90 52, 100 36 Z"
              fill={innerPetalFill}
              stroke="#F59E0B"
              strokeWidth="1.8"
              opacity="0.95"
            />
            <circle cx="100" cy="50" r="1.8" fill="#FEF3C7" />
          </g>
        ))}

        {/* Pendaran Sari Bunga Teratai */}
        <circle cx="100" cy="100" r="34" fill="url(#padma-glow)" />

        {/* Cincin Sari Ukir Bunga Teratai */}
        <circle
          cx="100"
          cy="100"
          r="30"
          stroke={petalStroke}
          strokeWidth="2"
          fill={isLight ? '#FFFDF9' : '#1C0B09'}
        />
        <circle
          cx="100"
          cy="100"
          r="26"
          stroke="#F59E0B"
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.8"
        />
      </svg>

      {/* Logo Pawon Hara di Pusat Teratai */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-12 h-12 rounded-full p-2 flex items-center justify-center">
          <img
            src={PawonHaraImg}
            alt="Pawon Hara"
            className="w-9 h-9 object-contain drop-shadow"
          />
        </div>
      </div>
    </div>
  )
}

/* ==========================================================================
   KOMPONEN UTAMA TRADITIONAL LOADER
   ========================================================================== */
export default function TraditionalLoader({
  variant = 'besek',
  size = 'lg',
  theme: explicitTheme,
  text = 'Meracik Hidangan Pawon...',
  subtext = 'Rempah alami dipadukan dengan kehangatan tradisi Nusantara',
  showSteam = true,
  showGlow = true,
  showEmbers = true,
  showBrandBadge = true,
  fullScreen = false,
  className = '',
}: TraditionalLoaderProps) {
  const storeTheme = useThemeStore((s) => s.theme)
  const isDark = (explicitTheme || storeTheme) === 'dark'
  const isLight = !isDark && explicitTheme !== 'glass'
  const isGlass = explicitTheme === 'glass'

  // Skala ukuran proporsional
  const sizeConfig = {
    sm: {
      box: 'w-24 h-24',
      fontSize: 'text-xs',
      subtextSize: 'text-[11px]',
    },
    md: {
      box: 'w-32 h-32',
      fontSize: 'text-sm',
      subtextSize: 'text-xs',
    },
    lg: {
      box: 'w-44 h-44',
      fontSize: 'text-base',
      subtextSize: 'text-xs',
    },
    xl: {
      box: 'w-56 h-56',
      fontSize: 'text-lg',
      subtextSize: 'text-sm',
    },
  }[size]

  // Skema warna teks tradisional
  const textColor = isLight ? 'text-[#2B120E]' : 'text-[#FAF5EE]'
  const subtextColor = isLight ? 'text-[#6B423A]' : 'text-amber-100/75'
  const eyebrowColor = isLight ? 'text-[#95271D]' : 'text-[#F59E0B]'

  const content = (
    <div
      className={`flex flex-col items-center justify-center text-center select-none ${className}`}
    >
      {/* Wadah Ilustrasi Loader */}
      <div className={`relative flex items-center justify-center ${sizeConfig.box}`}>
        {/* 1. Pendaran Bara Tungku / Lampu Teplok Hangat */}
        {showGlow && (
          <>
            <div
              className={`absolute inset-0 rounded-full blur-2xl pointer-events-none animate-hearth-glow ${
                isLight
                  ? 'bg-gradient-to-tr from-amber-300/40 via-orange-300/25 to-[#F59E0B]/20'
                  : 'bg-gradient-to-tr from-[#95271D]/45 via-[#E77B49]/35 to-[#F59E0B]/30'
              }`}
            />
            <div
              className={`absolute -inset-3 rounded-full blur-3xl pointer-events-none opacity-40 ${
                isLight ? 'bg-amber-200/35' : 'bg-[#60241E]/40'
              }`}
            />
          </>
        )}

        {/* 2. Partikel Rempah / Abu Hangat Melayang */}
        {showEmbers && <FloatingAromaticEmbers isLight={isLight} />}

        {/* 3. Kepulan Uap Hangat Alami */}
        {showSteam && <OrganicSteam isLight={isLight} />}

        {/* 4. Render Ilustrasi Tradisional Berdasarkan Varian Terpilih */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          {variant === 'besek' && <BesekBambuIllustration isLight={isLight} />}
          {variant === 'gunungan' && <GununganWayangIllustration isLight={isLight} />}
          {variant === 'kendil' && <KendilGerabahIllustration isLight={isLight} />}
          {variant === 'padma' && <PadmaKeratonIllustration isLight={isLight} />}
        </div>
      </div>

      {/* Teks Status & Nuansa Tradisional Jawa */}
      {(text || subtext || showBrandBadge) && (
        <div className="mt-5 flex flex-col items-center max-w-sm px-4">
          {/* Pita Brand Tradisional dengan Ornamen Sulur */}
          {showBrandBadge && (
            <div
              className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.25em] ${eyebrowColor}`}
            >
              <span className="text-xs opacity-75">❧</span>
              <span className="font-dhaksinarga tracking-widest text-xs">PAWON HARA</span>
              <span className="text-xs opacity-75">☙</span>
            </div>
          )}

          {/* Judul Status Utama (Font Dhaksinarga Khas Aksara Jawa) */}
          {text && (
            <h4
              className={`mt-2 font-dhaksinarga tracking-wide font-black ${sizeConfig.fontSize} ${textColor}`}
            >
              {text}
            </h4>
          )}

          {/* Subteks Keterangan */}
          {subtext && (
            <p
              className={`mt-1 leading-relaxed max-w-xs ${sizeConfig.subtextSize} ${subtextColor}`}
            >
              {subtext}
            </p>
          )}

          {/* Pembatas Tradisional Jawa dengan Filosofi Organik */}
          <div className="mt-3.5 flex flex-col items-center">
            <div className="flex items-center gap-2 text-xs">
              <span className={isLight ? 'text-[#B45309]/50' : 'text-[#F59E0B]/50'}>
                ❧ ━━━━
              </span>
              {/* Ornamen Tiga Butir Beras / Rempah Organik */}
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`inline-block rounded-full animate-rempah ${
                      isLight
                        ? 'bg-gradient-to-tr from-[#D97706] to-[#E77B49]'
                        : 'bg-gradient-to-tr from-[#F59E0B] to-[#E77B49]'
                    }`}
                    style={{
                      width: i === 1 ? '7px' : '5px',
                      height: i === 1 ? '7px' : '5px',
                      animationDelay: `${i * 300}ms`,
                    }}
                  />
                ))}
              </div>
              <span className={isLight ? 'text-[#B45309]/50' : 'text-[#F59E0B]/50'}>
                ━━━━ ☙
              </span>
            </div>

            <span
              className={`mt-1.5 text-[10px] tracking-widest uppercase font-medium ${
                isLight ? 'text-[#8C6B62]' : 'text-amber-200/50'
              }`}
            >
              Cita Rasa Tradisi Nusantara
            </span>
          </div>
        </div>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 z-[99999] flex items-center justify-center transition-all duration-400 backdrop-blur-md ${
          isGlass
            ? 'bg-stone-900/60 backdrop-blur-xl text-stone-100 border border-amber-500/20'
            : isLight
            ? 'bg-[#FBF7F2]/96 text-[#2B120E]'
            : 'bg-[#1C0B09]/96 text-stone-100'
        }`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100dvh',
        }}
      >
        {/* Pendaran Hangat Latar Belakang */}
        <div
          className={`pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl ${
            isLight ? 'bg-amber-200/40' : 'bg-[#60241E]/30'
          }`}
        />
        <div
          className={`pointer-events-none absolute -bottom-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl ${
            isLight ? 'bg-orange-200/30' : 'bg-[#F59E0B]/15'
          }`}
        />

        <div className="relative z-10">{content}</div>
      </div>
    )
  }

  return content
}
