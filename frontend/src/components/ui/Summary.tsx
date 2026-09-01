import { ArrowDown } from 'lucide-react'

interface SummaryProps {
  title: string
  description: string
  eyebrow?: string
}

export default function Summary({
  title,
  description,
  eyebrow = 'HARA CHICKEN',
}: SummaryProps) {
  return (
    <section className="relative overflow-hidden bg-red-600 text-white">
      {/* Decorative shapes */}
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-red-500" />
      <div className="absolute -bottom-40 -left-32 h-80 w-80 rounded-full bg-red-700" />

      <div className="absolute right-[18%] top-1/2 hidden h-3 w-3 -translate-y-1/2 rounded-full bg-yellow-400 sm:block" />
      <div className="absolute right-[12%] top-[35%] hidden h-2 w-2 rounded-full bg-white/40 sm:block" />

      <div className="relative mx-auto flex min-h-[430px] max-w-7xl items-end px-6 pb-16 pt-32 lg:px-8 lg:pb-20">
        <div className="max-w-4xl">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px w-10 bg-yellow-400" />

            <span className="text-xs font-bold tracking-[0.3em] text-yellow-400">
              {eyebrow}
            </span>
          </div>

          <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            {title}
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
            {description}
          </p>

          <div className="mt-10 flex items-center gap-3 text-sm font-semibold text-white/60">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20">
              <ArrowDown className="h-4 w-4" />
            </div>

            <span>Scroll untuk menjelajah</span>
          </div>
        </div>
      </div>
    </section>
  )
}
