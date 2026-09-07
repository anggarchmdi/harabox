import { ArrowDown, Sparkles } from 'lucide-react'

interface SummaryProps {
  title: string
  description: string
  eyebrow?: string
}

export default function Summary({
  title,
  description,
  eyebrow = 'HARA CHICKEN GOURMET CATERING',
}: SummaryProps) {
  return (
    <section className="relative overflow-hidden border-b border-zinc-200/70 bg-gradient-to-b from-white via-white to-[#fafaf9] pt-32 pb-16 sm:pt-36 sm:pb-20 lg:pt-40 lg:pb-24 text-zinc-900 selection:bg-zinc-950 selection:text-white">
      {/* Subtle ambient light patterns */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-zinc-100/70 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-amber-50/40 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Elegant luxury pill badge */}
          <div
            data-aos="fade-down"
            className="inline-flex items-center gap-2 rounded-full border shadow-sm shadow-yellow-500 border-zinc-200/90 bg-white/90 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.25em] text-zinc-700 backdrop-blur"
          >
            <Sparkles size={13} className="text-amber-500" />
            {eyebrow}
          </div>

          {/* Main Headline in Timeless High-Contrast Charcoal */}
          <h1
            data-aos="fade-up"
            data-aos-delay="100"
            className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-zinc-950 sm:text-6xl lg:text-7xl leading-[1.08]"
          >
            {title}
          </h1>

          {/* Description */}
          <p
            data-aos="fade-up"
            data-aos-delay="200"
            className="mt-6 max-w-2xl text-sm leading-relaxed text-zinc-500 sm:text-base lg:text-lg"
          >
            {description}
          </p>

          {/* Minimalist scroll hint */}
          <div
            data-aos="fade-up"
            data-aos-delay="300"
            className="mt-10 inline-flex items-center gap-2 text-xs font-bold text-zinc-400"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm">
              <ArrowDown size={13} />
            </div>
            <span>Scroll untuk menjelajah</span>
          </div>
        </div>
      </div>
    </section>
  )
}
