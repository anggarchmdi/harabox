import TraditionalLoader, {
  type TraditionalLoaderVariant,
} from './TraditionalLoader'

export interface LogoSpinnerProps {
  /** Size preset of the spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Main loading message displayed below spinner */
  text?: string
  /** Secondary subtitle / hint */
  subtext?: string
  /** Visual theme */
  theme?: 'light' | 'dark' | 'glass'
  /** Logo variant in the center (kompatibilitas prop) */
  logoVariant?: 'mascot' | 'full'
  /** Whether to render with warm hearth ripples / steam */
  showRipples?: boolean
  /** Whether to render glowing ambient hearth warmth */
  showGlow?: boolean
  /** Whether to display the traditional rempah indicator / floating embers */
  showProgressBar?: boolean
  /** Fullscreen backdrop overlay mode */
  fullScreen?: boolean
  /** Additional wrapper CSS classes */
  className?: string
  /** Varian tradisional Nusantara terpilih (default: 'kendil' gerabah tradisional) */
  variant?: TraditionalLoaderVariant
}

/**
 * LogoSpinner - Komponen loader utama Pawon Hara
 * Menggunakan konsep Kendil Gerabah Tradisional & Tungku Kayu Bakar Nusantara.
 * Menghilangkan putaran cakra gear robotik, digantikan kuali tanah liat & bara hangat.
 */
export default function LogoSpinner({
  size = 'lg',
  text = 'Memproses Hidangan...',
  subtext,
  theme,
  showRipples = true,
  showGlow = true,
  showProgressBar = true,
  fullScreen = false,
  className = '',
  variant = 'kendil',
}: LogoSpinnerProps) {
  return (
    <TraditionalLoader
      variant={variant}
      size={size}
      theme={theme}
      text={text}
      subtext={subtext}
      showSteam={showRipples}
      showGlow={showGlow}
      showEmbers={showProgressBar}
      showBrandBadge={true}
      fullScreen={fullScreen}
      className={className}
    />
  )
}
