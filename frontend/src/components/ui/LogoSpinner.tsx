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

export default function LogoSpinner({
  size = 'lg',
  text = 'Memproses...',
  subtext,
  showRipples = true,
  showGlow = true,
  showProgressBar = true,
  fullScreen = false,
  className = '',
}: LogoSpinnerProps) {
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
  const textColor = 'text-white'
  const subtextColor = 'text-amber-100/80'
  const trackBg = 'bg-[#2D120F] border border-[#60241E]'

  const content = (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      {/* Spinner Graphic Container */}
      <div className={`relative flex items-center justify-center ${sizeConfig.outer}`}>
        {/* 1. Ambient Glow Orbs */}
        {showGlow && (
          <>
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#60241E]/50 via-[#E77B49]/30 to-[#F59E0B]/30 blur-xl animate-pulse-subtle pointer-events-none" />
            <div className="absolute -inset-2 rounded-full bg-[#F59E0B]/15 blur-2xl pointer-events-none" />
          </>
        )}

        {/* 2. Concentric Radar Pulse Ring */}
        {showRipples && (
          <div className="absolute inset-2 rounded-full bg-[#F59E0B]/15 animate-ping duration-1000 pointer-events-none" />
        )}

        {/* 3. Outer Orbit Track (Subtle background groove) */}
        <div
          className={`absolute inset-0 rounded-full ${sizeConfig.borderWidth} border-[#60241E]/80`}
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
          className={`absolute inset-2 rounded-full ${sizeConfig.borderWidth} border-transparent border-b-[#F59E0B] border-l-[#95271D] animate-spin-reverse`}
          style={{ animationDuration: '1.8s' }}
        />

        {/* 6. Center Logo Core (Pawon Hara Monogram Badge) */}
        <div className={`relative z-10 flex items-center justify-center ${sizeConfig.core} animate-pulse-subtle`}>
          <img src={PawonHaraImg} className='w-28' alt="" />
        </div>
      </div>

      {/* Text Label & Progress Status */}
      {(text || subtext) && (
        <div className="mt-6 flex flex-col items-center max-w-xs px-4 animate-fade-in">
          {/* Brand Eyebrow */}
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-[#F59E0B]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
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
              <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent rounded-full animate-shimmer" />
            </div>
          )}
        </div>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 bg-[#1C0B09]/95 backdrop-blur-md"
      >
        {/* Cinematic Backdrop Ambient Rings */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#60241E]/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#F59E0B]/15 blur-3xl" />

        <div className="relative z-10">{content}</div>
      </div>
    )
  }

  return content
}
