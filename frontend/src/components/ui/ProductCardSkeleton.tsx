interface ProductCardSkeletonProps {
  /** Number of skeleton cards to render in the grid */
  count?: number
  /** Additional CSS classes for the grid container */
  className?: string
}

export function ProductCardSkeletonItem() {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-[#60241E]/80 bg-[#2D120F] shadow-lg transition duration-300">
      {/* 1. Image Shimmer Box */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#1A0A08]">
        {/* Shimmer Sweep Animation */}
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[#60241E]/40 to-transparent pointer-events-none" />

        {/* Top Badges Skeleton */}
        <div className="absolute left-4 top-4 flex items-center gap-1.5">
          <div className="h-6 w-16 rounded-full bg-[#3B1814] animate-pulse" />
        </div>

        {/* Rating Pill Skeleton */}
        <div className="absolute right-4 top-4 h-6 w-12 rounded-full bg-[#3B1814] animate-pulse" />

        {/* Bottom Min Order Tag Skeleton */}
        <div className="absolute bottom-3 left-3 h-5 w-24 rounded-xl bg-[#3B1814] animate-pulse" />
      </div>

      {/* 2. Content Skeleton */}
      <div className="flex flex-1 flex-col p-6">
        {/* Title Skeleton */}
        <div className="h-6 w-3/4 rounded-xl bg-[#3B1814] animate-pulse mb-3" />

        {/* Description Skeleton */}
        <div className="space-y-2 mb-6">
          <div className="h-3.5 w-full rounded-md bg-[#3B1814]/70 animate-pulse" />
          <div className="h-3.5 w-2/3 rounded-md bg-[#3B1814]/70 animate-pulse" />
        </div>

        {/* Card Footer Divider & Actions */}
        <div className="mt-auto pt-4 border-t border-[#60241E]/60 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="h-2.5 w-16 rounded bg-[#3B1814]/50 animate-pulse" />
            <div className="h-6 w-24 rounded-lg bg-[#3B1814] animate-pulse" />
          </div>

          <div className="h-10 w-24 rounded-xl bg-[#3B1814] animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default function ProductCardSkeleton({
  count = 6,
  className = 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3',
}: ProductCardSkeletonProps) {
  return (
    <div className={className} aria-busy="true" aria-label="Memuat daftar menu pilihan...">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeletonItem key={index} />
      ))}
    </div>
  )
}
