export interface LogoSpinnerProps {
  /** Size preset of the spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Main loading message displayed below spinner */
  text?: string
  /** Secondary subtitle / hint */
  subtext?: string
  /** Visual theme */
  theme?: 'light' | 'dark' | 'glass'
  /** Logo variant in the center: mascot avatar (circular) or full horizontal brand badge */
  logoVariant?: 'mascot' | 'full'
  /** Whether to render with warm hearth ripples */
  showRipples?: boolean
  /** Whether to render glowing ambient hearth warmth */
  showGlow?: boolean
  /** Whether to display the traditional rempah rhythm indicator */
  showProgressBar?: boolean
  /** Fullscreen backdrop overlay mode */
  fullScreen?: boolean
  /** Additional wrapper CSS classes */
  className?: string
}

import PawonHaraImg from '../../assets/PawonHara.webp'
import { useThemeStore } from '../../stores/theme.store'

/**
 * Ornamen Tradisional SVG Cakra Mandala Batik Kawung Jawa
 * Menghadirkan pola sakral 8 kelopak Batik Kawung yang berputar anggun,
 * dihiasi bulir cecek rempah dan sinar surya cakra keraton.
 */
function BatikCakraMandala({ className = '' }: { className?: string }) {
  const angles = [0, 45, 90, 135, 180, 225, 270, 315]
  const rayAngles = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5]

  return (
    <svg
      viewBox="0 0 240 240"
      className={`w-full h-full ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 1. Lingkar Luar Berbiku & Cecek Batik */}
      <circle
        cx="120"
        cy="120"
        r="116"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="2 4"
        opacity="0.45"
      />
      <circle
        cx="120"
        cy="120"
        r="110"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.75"
      />
      <circle
        cx="120"
        cy="120"
        r="104"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeDasharray="4 4"
        opacity="0.5"
      />

      {/* 2. Sinar Surya Cakra Jawa (Ray Accents) */}
      {rayAngles.map((angle) => (
        <g key={`ray-${angle}`} transform={`rotate(${angle} 120 120)`}>
          <line
            x1="120"
            y1="10"
            x2="120"
            y2="24"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.8"
          />
          <circle cx="120" cy="7" r="1.8" fill="currentColor" opacity="0.9" />
        </g>
      ))}

      {/* 3. Delapan Kelopak Sakral Batik Kawung */}
      {angles.map((angle) => (
        <g key={`kawung-${angle}`} transform={`rotate(${angle} 120 120)`}>
          {/* Kelopak Luar Kawung */}
          <path
            d="M 120 22 C 134 40, 136 72, 120 92 C 104 72, 106 40, 120 22 Z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="currentColor"
            fillOpacity="0.08"
          />
          {/* Garis Urat Daun Kelopak */}
          <path
            d="M 120 32 L 120 82"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="2 3"
            opacity="0.6"
          />
          {/* Dua Butir Cecek Rempah di Dalam Kelopak */}
          <circle cx="120" cy="44" r="2.2" fill="currentColor" opacity="0.9" />
          <circle cx="120" cy="64" r="2.2" fill="currentColor" opacity="0.9" />
        </g>
      ))}

      {/* 4. Cincin Tengah Ornamen Tembaga */}
      <circle
        cx="120"
        cy="120"
        r="80"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.85"
      />
      <circle
        cx="120"
        cy="120"
        r="75"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.6"
      />
    </svg>
  )
}

/**
 * Cincin Sulur Dalam Ornamen Ukir Tradisional (Counter-Rotating)
 */
function InnerSulurRing({ className = '' }: { className?: string }) {
  const petals = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]

  return (
    <svg
      viewBox="0 0 160 160"
      className={`w-full h-full ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="80"
        cy="80"
        r="72"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
      {petals.map((deg) => (
        <g key={`petal-${deg}`} transform={`rotate(${deg} 80 80)`}>
          <circle cx="80" cy="12" r="1.6" fill="currentColor" opacity="0.8" />
          <path
            d="M 77 15 Q 80 20 83 15"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.6"
          />
        </g>
      ))}
    </svg>
  )
}

/**
 * Kebul Uap Dapur Tradisional Pawon (Warm Rising Steam)
 * Melambangkan hidangan lezat hangat yang baru matang dari dapur Pawon Hara.
 */
function PawonSteamWisps({ isLight }: { isLight: boolean }) {
  const steamColor = isLight ? 'text-amber-600/70' : 'text-amber-400/80'

  return (
    <div className="pointer-events-none absolute -top-8 sm:-top-9 left-1/2 -translate-x-1/2 flex items-end justify-center gap-2 z-20">
      {/* Liukan Uap Kiri */}
      <svg
        className={`w-3 h-7 ${steamColor} animate-steam-1 filter blur-[0.4px]`}
        viewBox="0 0 14 36"
        fill="none"
      >
        <path
          d="M 7 36 C 3 26, 11 18, 7 10 C 5 6, 9 3, 7 0"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>

      {/* Liukan Uap Tengah (Lebih Tinggi) */}
      <svg
        className={`w-3.5 h-9 ${isLight ? 'text-orange-600/80' : 'text-amber-300/90'} animate-steam-2 filter blur-[0.3px]`}
        viewBox="0 0 16 42"
        fill="none"
      >
        <path
          d="M 8 42 C 13 30, 3 22, 9 11 C 12 5, 6 2, 8 0"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>

      {/* Liukan Uap Kanan */}
      <svg
        className={`w-3 h-7 ${steamColor} animate-steam-3 filter blur-[0.4px]`}
        viewBox="0 0 14 36"
        fill="none"
      >
        <path
          d="M 7 36 C 4 26, 10 18, 6 10 C 4 6, 8 3, 7 0"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

export default function LogoSpinner({
  size = 'lg',
  text = 'Memproses Hidangan...',
  subtext,
  theme: explicitTheme,
  showRipples = true,
  showGlow = true,
  showProgressBar = true,
  fullScreen = false,
  className = '',
}: LogoSpinnerProps) {
  const storeTheme = useThemeStore((s) => s.theme)
  const isDark = (explicitTheme || storeTheme) === 'dark'
  const isLight = !isDark && explicitTheme !== 'glass'
  const isGlass = explicitTheme === 'glass'

  // Konfigurasi ukuran proporsional
  const sizeConfig = {
    sm: {
      outer: 'w-24 h-24',
      inner: 'w-20 h-20',
      core: 'w-14 h-14',
      imgWidth: 'w-11',
      fontSize: 'text-xs',
      dividerWidth: 'w-28',
    },
    md: {
      outer: 'w-32 h-32',
      inner: 'w-26 h-26',
      core: 'w-18 h-18',
      imgWidth: 'w-14',
      fontSize: 'text-sm',
      dividerWidth: 'w-36',
    },
    lg: {
      outer: 'w-40 h-40',
      inner: 'w-32 h-32',
      core: 'w-22 h-22',
      imgWidth: 'w-18',
      fontSize: 'text-base',
      dividerWidth: 'w-44',
    },
    xl: {
      outer: 'w-52 h-52',
      inner: 'w-42 h-42',
      core: 'w-28 h-28',
      imgWidth: 'w-22',
      fontSize: 'text-lg',
      dividerWidth: 'w-52',
    },
  }[size]

  // Palet Warna Tradisional Pawon Hara (Kayu Jati, Kuningan, Terakota, & Emas)
  const textColor = isLight ? 'text-[#2B120E]' : 'text-[#FAF5EE]'
  const subtextColor = isLight ? 'text-[#6B423A]' : 'text-amber-100/75'
  const cakraColor = isLight ? 'text-[#D97706]' : 'text-[#F59E0B]'
  const innerCakraColor = isLight ? 'text-[#B45309]/80' : 'text-[#E77B49]/80'
  const eyebrowColor = isLight ? 'text-[#95271D]' : 'text-[#F59E0B]'

  const content = (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      {/* Wadah Grafis Loader Utama */}
      <div className={`relative flex items-center justify-center ${sizeConfig.outer}`}>
        {/* 1. Pendaran Kehangatan Bara Tungku Pawon (Hearth Glow) */}
        {showGlow && (
          <>
            <div
              className={`absolute inset-1 rounded-full blur-2xl pointer-events-none animate-hearth-glow ${
                isLight
                  ? 'bg-gradient-to-tr from-amber-300/40 via-orange-300/25 to-[#F59E0B]/20'
                  : 'bg-gradient-to-tr from-[#95271D]/45 via-[#E77B49]/35 to-[#F59E0B]/30'
              }`}
            />
            <div
              className={`absolute -inset-3 rounded-full blur-3xl pointer-events-none opacity-50 ${
                isLight ? 'bg-amber-200/30' : 'bg-[#60241E]/40'
              }`}
            />
          </>
        )}

        {/* 2. Pendaran Lembut Permukaan Piring Gerabah */}
        {showRipples && (
          <div
            className={`absolute inset-2 rounded-full pointer-events-none animate-hearth-glow ${
              isLight
                ? 'bg-gradient-to-tr from-amber-100/60 to-orange-100/30'
                : 'bg-gradient-to-tr from-[#60241E]/30 to-[#95271D]/20'
            }`}
          />
        )}

        {/* 3. Ornamen Cakra Mandala Batik Kawung (Putaran Anggun Tradisional 16 Detik) */}
        <div className={`absolute inset-0 ${cakraColor} animate-cakra-slow`}>
          <BatikCakraMandala />
        </div>

        {/* 4. Cincin Sulur Ornamen Dalam (Putaran Anggun Berlawanan Jarum Jam) */}
        <div className={`absolute inset-3 sm:inset-3.5 ${innerCakraColor} animate-cakra-reverse-slow`}>
          <InnerSulurRing />
        </div>

        {/* 5. Kebul Uap Hangat Dapur Pawon (Di Atas Medali Logo) */}
        <PawonSteamWisps isLight={isLight} />

        {/* 6. Inti Medali Tradisional (Logo Pawon Hara) */}
        <div
          className={`relative z-10 flex items-center justify-center rounded-full p-2.5 transition-transform duration-300 ${sizeConfig.core} animate-pulse-subtle ${
            isLight
              ? 'bg-gradient-to-b from-[#FFFDF9] via-[#FAF5EE] to-[#F5ECE0] border-2 border-[#D97706]/40 shadow-[0_4px_16px_rgba(217,119,6,0.15)]'
              : isGlass
                ? 'bg-[#1C0B09]/80 backdrop-blur-md border-2 border-[#F59E0B]/40 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                : 'bg-gradient-to-b from-[#2D120F] via-[#1C0B09] to-[#240E0C] border-2 border-[#F59E0B]/50 shadow-[0_4px_24px_rgba(245,158,11,0.22)]'
          }`}
        >
          <img
            src={PawonHaraImg}
            className={`${sizeConfig.imgWidth} drop-shadow-md object-contain transition-transform duration-300`}
            alt="Pawon Hara"
          />
        </div>
      </div>

      {/* Teks Status & Nuansa Tradisional Jawa */}
      {(text || subtext) && (
        <div className="mt-5 flex flex-col items-center max-w-sm px-4 animate-fade-in">
          {/* Pita Brand Tradisional dengan Ornamen Sulur */}
          <div
            className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.25em] ${eyebrowColor}`}
          >
            <span className="text-xs opacity-75">❧</span>
            <span className="font-dhaksinarga tracking-widest text-xs">PAWON HARA</span>
            <span className="text-xs opacity-75">☙</span>
          </div>

          {/* Teks Status Utama (Font Dhaksinarga Khas Aksara Jawa) */}
          {text && (
            <h4
              className={`mt-2 font-dhaksinarga tracking-wide font-black ${sizeConfig.fontSize} ${textColor}`}
            >
              {text}
            </h4>
          )}

          {/* Subteks Keterangan */}
          {subtext && (
            <p className={`mt-1 text-xs leading-relaxed max-w-xs ${subtextColor}`}>
              {subtext}
            </p>
          )}

          {/* Indikator Ritme Rempah Tradisional (Pengganti Cyber Shimmer Bar) */}
          {showProgressBar && (
            <div className="mt-3.5 flex flex-col items-center">
              <div className="flex items-center gap-2 text-xs">
                <span className={isLight ? 'text-[#B45309]/50' : 'text-[#F59E0B]/50'}>
                  ❖ ━━━━
                </span>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={`inline-block rounded-full animate-rempah ${
                        isLight
                          ? 'bg-gradient-to-tr from-[#D97706] to-[#E77B49]'
                          : 'bg-gradient-to-tr from-[#F59E0B] to-[#E77B49]'
                      }`}
                      style={{
                        width: i === 2 ? '7px' : '5px',
                        height: i === 2 ? '7px' : '5px',
                        animationDelay: `${i * 220}ms`,
                      }}
                    />
                  ))}
                </div>
                <span className={isLight ? 'text-[#B45309]/50' : 'text-[#F59E0B]/50'}>
                  ━━━━ ❖
                </span>
              </div>
              <span
                className={`mt-1.5 text-[10px] tracking-widest uppercase font-medium ${
                  isLight ? 'text-[#8C6B62]' : 'text-amber-200/50'
                }`}
              >
                Dari Pawon Ke Meja Anda
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 backdrop-blur-md ${
          isLight ? 'bg-[#FBF7F2]/95 text-[#2B120E]' : 'bg-[#1C0B09]/95 text-stone-100'
        }`}
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
