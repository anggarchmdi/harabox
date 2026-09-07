import LogoImg from '../../assets/HARALOAD.png'

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

export default function LogoSpinner({
  size = 'lg',
  text = 'Memproses...',
  subtext,
  theme = 'light',
  logoVariant = 'mascot',
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

  // Theme color tokens
  const isDark = theme === 'dark'
  const textColor = isDark ? 'text-white' : 'text-zinc-950'
  const subtextColor = isDark ? 'text-zinc-400' : 'text-zinc-500'
  const coreBg = isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-zinc-100/90'
  const trackBg = isDark ? 'bg-zinc-800/80' : 'bg-zinc-200/80'

  const content = (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      {/* Spinner Graphic Container */}
      <div className={`relative flex items-center justify-center ${sizeConfig.outer}`}>
        {/* 1. Ambient Glow Orbs */}
        {showGlow && (
          <>
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-red-600/30 via-orange-500/25 to-amber-400/30 blur-xl animate-pulse-subtle pointer-events-none" />
            <div className="absolute -inset-2 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
          </>
        )}

        {/* 2. Concentric Radar Pulse Ring */}
        {showRipples && (
          <div className="absolute inset-2 rounded-full bg-red-500/10 animate-ping duration-1000 pointer-events-none" />
        )}

        {/* 3. Outer Orbit Track (Subtle background groove) */}
        <div
          className={`absolute inset-0 rounded-full ${sizeConfig.borderWidth} ${isDark ? 'border-zinc-800/70' : 'border-zinc-200/70'
            }`}
        />

        {/* 4. Outer Rotating Gradient Arc (Clockwise) */}
        <div
          className={`absolute inset-0 rounded-full ${sizeConfig.borderWidth} border-transparent border-t-red-600 border-r-amber-500 animate-spin`}
          style={{ animationDuration: '2.4s' }}
        />

        {/* Outer Glow Trail */}
        <div
          className={`absolute inset-0 rounded-full ${sizeConfig.borderWidth} border-transparent border-t-red-500/70 border-r-amber-400/70 blur-[2.5px] animate-spin`}
          style={{ animationDuration: '2.4s' }}
        />

        {/* 5. Inner Counter-Rotating Gradient Arc (Counter-Clockwise) */}
        <div
          className={`absolute inset-2 rounded-full ${sizeConfig.borderWidth} border-transparent border-b-orange-500 border-l-red-500 animate-spin-reverse`}
          style={{ animationDuration: '1.8s' }}
        />

        {/* 6. Center Logo Core (Pure logo without white background) */}
        {logoVariant === 'mascot' ? (
          <div
            className={`relative z-10 flex items-center justify-center ${sizeConfig.core} animate-pulse-subtle`}
          >
            <img
              src={LogoImg}
              alt="Hara Chicken Mascot"
              className="w-full h-full object-contain drop-shadow-md select-none"
            />
          </div>
        ) : (
          // Full Logo Pill Core
          <div
            className={`relative z-10 flex items-center justify-center rounded-2xl ${sizeConfig.fullWidth} ${coreBg} px-3 py-1.5 shadow-xl shadow-red-600/15 border animate-pulse-subtle overflow-hidden`}
          >
            <img
              src={LogoImg}
              alt="Hara Chicken Logo"
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Text Label & Progress Status */}
      {(text || subtext) && (
        <div className="mt-6 flex flex-col items-center max-w-xs px-4 animate-fade-in">
          {/* Brand Eyebrow */}
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-red-600 font-poppins">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
            <span>HARA CHICKEN</span>
          </div>

          {/* Primary Status Text */}
          {text && (
            <h4
              className={`mt-1.5 font-poppins font-black tracking-tight ${sizeConfig.fontSize} ${textColor}`}
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
              <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-red-600 to-transparent rounded-full animate-shimmer" />
            </div>
          )}
        </div>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${isDark
          ? 'bg-zinc-950/85 backdrop-blur-md'
          : 'bg-white/85 backdrop-blur-md'
          }`}
      >
        {/* Cinematic Backdrop Ambient Rings */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-red-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative z-10">{content}</div>
      </div>
    )
  }

  return content
}
