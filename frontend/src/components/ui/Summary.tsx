import { ArrowDown, Sparkles } from 'lucide-react'

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
  return (
    <section className="relative overflow-hidden border-b border-[#60241E]/80 bg-gradient-to-b from-[#1C0B09] via-[#240E0C] to-[#1C0B09] pt-32 pb-16 sm:pt-36 sm:pb-20 lg:pt-40 lg:pb-24 text-stone-100 selection:bg-[#F59E0B] selection:text-[#1C0B09]">
      {/* Subtle ambient light patterns */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#60241E]/40 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-[#F59E0B]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Elegant luxury pill badge */}
          <div
            data-aos="fade-down"
            className="inline-flex items-center gap-2 rounded-full border border-[#F59E0B]/40 bg-[#60241E] px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.25em] text-amber-300 shadow-md backdrop-blur"
          >
            <Sparkles size={13} className="text-[#F59E0B]" />
            {eyebrow}
          </div>

          {/* Main Headline in Dhaksinarga */}
          <h1
            data-aos="fade-up"
            data-aos-delay="100"
            className="mt-6 max-w-4xl text-3xl font-dhaksinarga tracking-wide text-white sm:text-5xl lg:text-7xl leading-[1.1]"
          >
            {title}
          </h1>

          {/* Description */}
          <p
            data-aos="fade-up"
            data-aos-delay="200"
            className="mt-6 max-w-2xl text-sm leading-relaxed text-amber-100/75 sm:text-base lg:text-lg"
          >
            {description}
          </p>

          {/* Minimalist scroll hint */}
          <div
            data-aos="fade-up"
            data-aos-delay="300"
            className="mt-10 inline-flex items-center gap-2 text-xs font-bold text-amber-200/50"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#60241E] bg-[#2D120F] text-[#F59E0B] shadow-sm">
              <ArrowDown size={13} />
            </div>
            <span>Scroll untuk menjelajah</span>
          </div>
        </div>
      </div>
    </section>
  )
}
