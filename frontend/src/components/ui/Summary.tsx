import { ArrowDown, Sparkles } from 'lucide-react'
import { useThemeStore } from '../../stores/theme.store'

interface SummaryProps {
  title: string
  description: string
  eyebrow?: string
}

export default function Summary({
  title,
  description,
  eyebrow = 'PAWON HARA CATERING & BENTO',
}: SummaryProps) {
  const theme = useThemeStore((state) => state.theme)
  const isDark = theme === 'dark'

  return (
    <section
      className={`relative overflow-hidden border-b pt-32 pb-16 sm:pt-36 sm:pb-20 lg:pt-40 lg:pb-24 transition-colors duration-300 ${
        isDark
          ? 'border-[#60241E]/80 bg-gradient-to-b from-[#1C0B09] via-[#240E0C] to-[#1C0B09] text-stone-100 selection:bg-[#F59E0B] selection:text-[#1C0B09]'
          : 'border-[#E6DACD] bg-gradient-to-b from-[#FAF4ED] via-[#F5EDE4] to-[#FBF7F2] text-[#2B120E] selection:bg-[#F59E0B] selection:text-[#2B120E]'
      }`}
    >
      {/* Subtle ambient light patterns */}
      <div
        className={`pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-3xl ${
          isDark
            ? 'bg-gradient-to-b from-[#60241E]/40 to-transparent'
            : 'bg-gradient-to-b from-[#E77B49]/15 to-transparent'
        }`}
      />
      <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-[#F59E0B]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Elegant luxury pill badge */}
          <div
            data-aos="fade-down"
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.25em] shadow-md backdrop-blur ${
              isDark
                ? 'border-[#F59E0B]/40 bg-[#60241E] text-amber-300'
                : 'border-[#D97706]/40 bg-[#FAF0E4] text-[#8C4320]'
            }`}
          >
            <Sparkles size={13} className={isDark ? 'text-[#F59E0B]' : 'text-[#D97706]'} />
            {eyebrow}
          </div>

          {/* Main Headline in Dhaksinarga */}
          <h1
            data-aos="fade-up"
            data-aos-delay="100"
            className={`mt-6 max-w-4xl text-3xl font-dhaksinarga tracking-wide sm:text-5xl lg:text-7xl leading-[1.1] ${
              isDark ? 'text-white' : 'text-[#2B120E]'
            }`}
          >
            {title}
          </h1>

          {/* Description */}
          <p
            data-aos="fade-up"
            data-aos-delay="200"
            className={`mt-6 max-w-2xl text-sm leading-relaxed sm:text-base lg:text-lg ${
              isDark ? 'text-amber-100/75' : 'text-[#6B423A]'
            }`}
          >
            {description}
          </p>

          {/* Minimalist scroll hint */}
          <div
            data-aos="fade-up"
            data-aos-delay="300"
            className={`mt-10 inline-flex items-center gap-2 text-xs font-bold ${
              isDark ? 'text-amber-200/50' : 'text-[#8C6B62]'
            }`}
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full border shadow-sm ${
                isDark
                  ? 'border-[#60241E] bg-[#2D120F] text-[#F59E0B]'
                  : 'border-[#E6DACD] bg-white text-[#D97706]'
              }`}
            >
              <ArrowDown size={13} />
            </div>
            <span>Scroll untuk menjelajah</span>
          </div>
        </div>
      </div>
    </section>
  )
}
