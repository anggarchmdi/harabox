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
  /** Whether to render with radar ripples */
  showRipples?: boolean
  /** Whether to render glowing ambient blur */
  showGlow?: boolean
  /** Whether to display a sleek animated progress shimmer bar */
  showProgressBar?: boolean
  /** Fullscreen backdrop overlay mode */
  fullScreen?: boolean
  /** Additional wrapper CSS classes */
  className?: string
}

import PawonHaraImg from '../../assets/PawonHara.webp'
import { useThemeStore } from '../../stores/theme.store'

export default function LogoSpinner({
  size = 'lg',
  text = 'Memproses...',
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

  // Dimension tokens mapped by size
  const sizeConfig = {
    sm: {
      outer: 'w-20 h-20',
      inner: 'w-16 h-16',
      core: 'w-12 h-12',
      badgePadding: 'p-0',
      fullWidth: 'w-16 h-9',
      borderWidth: 'border-[2px]',
      fontSize: 'text-xs',
    },
    md: {
      outer: 'w-28 h-28',
      inner: 'w-22 h-22',
      core: 'w-16 h-16',
      badgePadding: 'p-0',
      fullWidth: 'w-20 h-11',
      borderWidth: 'border-[2.5px]',
      fontSize: 'text-sm',
    },
    lg: {
      outer: 'w-36 h-36',
      inner: 'w-28 h-28',
      core: 'w-22 h-22',
      badgePadding: 'p-0',
      fullWidth: 'w-26 h-14',
      borderWidth: 'border-[3px]',
      fontSize: 'text-base',
    },
    xl: {
      outer: 'w-48 h-48',
      inner: 'w-38 h-38',
      core: 'w-30 h-30',
      badgePadding: 'p-0',
      fullWidth: 'w-34 h-18',
      borderWidth: 'border-[4px]',
      fontSize: 'text-lg',
    },
  }[size]

  // Theme color tokens (Pawon Hara Luxury Palette)
  const textColor = isLight ? 'text-[#2B120E]' : 'text-white'
  const subtextColor = isLight ? 'text-[#5C3831]' : 'text-amber-100/80'
  const trackBg = isLight
    ? 'bg-[#FAF5EE] border border-[#E6DACD]'
    : isGlass
      ? 'bg-white/10 border border-white/20'
      : 'bg-[#2D120F] border border-[#60241E]'
  const orbitBorder = isLight ? 'border-[#E6DACD]' : 'border-[#60241E]/80'
  const eyebrowColor = isLight ? 'text-[#D97706]' : 'text-[#F59E0B]'
  const eyebrowDotColor = isLight ? 'bg-[#D97706]' : 'bg-[#F59E0B]'
  const shimmerVia = isLight ? 'via-[#D97706]' : 'via-[#F59E0B]'
  const rippleBg = isLight ? 'bg-[#F59E0B]/20' : 'bg-[#F59E0B]/15'

  const content = (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      {/* Spinner Graphic Container */}
      <div className={`relative flex items-center justify-center ${sizeConfig.outer}`}>
        {/* 1. Ambient Glow Orbs */}
        {showGlow && (
          <>
            <div className={`absolute inset-0 rounded-full blur-xl animate-pulse-subtle pointer-events-none ${
              isLight
                ? 'bg-gradient-to-tr from-amber-200/50 via-orange-200/30 to-[#F59E0B]/25'
                : 'bg-gradient-to-tr from-[#60241E]/50 via-[#E77B49]/30 to-[#F59E0B]/30'
            }`} />
            <div className={`absolute -inset-2 rounded-full blur-2xl pointer-events-none ${
              isLight ? 'bg-amber-300/15' : 'bg-[#F59E0B]/15'
            }`} />
          </>
        )}

        {/* 2. Concentric Radar Pulse Ring */}
        {showRipples && (
          <div className={`absolute inset-2 rounded-full animate-ping duration-1000 pointer-events-none ${rippleBg}`} />
        )}

        {/* 3. Outer Orbit Track (Subtle background groove) */}
        <div
          className={`absolute inset-0 rounded-full ${sizeConfig.borderWidth} ${orbitBorder}`}
        />

        {/* 4. Outer Rotating Gradient Arc (Clockwise) */}
        <div
          className={`absolute inset-0 rounded-full ${sizeConfig.borderWidth} border-transparent border-t-[#F59E0B] border-r-[#E77B49] animate-spin`}
          style={{ animationDuration: '2.4s' }}
        />

        {/* Outer Glow Trail */}
        <div
          className={`absolute inset-0 rounded-full ${sizeConfig.borderWidth} border-transparent border-t-[#F59E0B]/70 border-r-[#E77B49]/70 blur-[2.5px] animate-spin`}
          style={{ animationDuration: '2.4s' }}
        />

        {/* 5. Inner Counter-Rotating Gradient Arc (Counter-Clockwise) */}
        <div
          className={`absolute inset-2 rounded-full ${sizeConfig.borderWidth} border-transparent ${
            isLight
              ? 'border-b-[#F59E0B] border-l-[#E77B49]'
              : 'border-b-[#F59E0B] border-l-[#95271D]'
          } animate-spin-reverse`}
          style={{ animationDuration: '1.8s' }}
        />

        {/* 6. Center Logo Core (Pawon Hara Monogram Badge) */}
        <div className={`relative z-10 flex items-center justify-center ${sizeConfig.core} animate-pulse-subtle`}>
          <img src={PawonHaraImg} className="w-28 drop-shadow-xs" alt="Pawon Hara" />
        </div>
      </div>

      {/* Text Label & Progress Status */}
      {(text || subtext) && (
        <div className="mt-6 flex flex-col items-center max-w-xs px-4 animate-fade-in">
          {/* Brand Eyebrow */}
          <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] ${eyebrowColor}`}>
            <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${eyebrowDotColor}`} />
            <span className="font-dhaksinarga tracking-widest text-xs">PAWON HARA</span>
          </div>

          {/* Primary Status Text */}
          {text && (
            <h4
              className={`mt-2 font-dhaksinarga tracking-wide ${sizeConfig.fontSize} ${textColor}`}
            >
              {text}
            </h4>
          )}

          {/* Subtext / Description */}
          {subtext && (
            <p className={`mt-1 text-xs leading-relaxed ${subtextColor}`}>
              {subtext}
            </p>
          )}

          {/* Shimmer Progress Track */}
          {showProgressBar && (
            <div
              className={`mt-3.5 h-1.5 w-40 rounded-full ${trackBg} overflow-hidden relative shadow-inner`}
            >
              <div className={`absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent ${shimmerVia} to-transparent rounded-full animate-shimmer`} />
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
        {/* Cinematic Backdrop Ambient Rings */}
        <div className={`pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl ${
          isLight ? 'bg-amber-200/40' : 'bg-[#60241E]/30'
        }`} />
        <div className={`pointer-events-none absolute -bottom-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl ${
          isLight ? 'bg-orange-200/30' : 'bg-[#F59E0B]/15'
        }`} />

        <div className="relative z-10">{content}</div>
      </div>
    )
  }

  return content
}
