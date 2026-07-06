const SkeletonBlock = ({ className = "" }) => (
  <div className={`gg-skeleton ${className}`} aria-hidden="true" />
)

export const CardGridSkeleton = ({ count = 6, image = true }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading content">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {image && <SkeletonBlock className="aspect-[16/10] rounded-none border-0" />}
        <div className="space-y-3 p-4">
          <SkeletonBlock className="h-5 w-3/4" />
          <SkeletonBlock className="h-4 w-1/2" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <SkeletonBlock className="h-12" />
            <SkeletonBlock className="h-12" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

export const HeroPanelSkeleton = () => (
  <section className="gg-glass rounded-[2rem] border border-white/70 p-6 sm:p-8" aria-label="Loading page header">
    <SkeletonBlock className="h-3 w-32" />
    <SkeletonBlock className="mt-4 h-10 w-full max-w-xl" />
    <SkeletonBlock className="mt-3 h-4 w-full max-w-2xl" />
    <SkeletonBlock className="mt-2 h-4 w-2/3 max-w-xl" />
  </section>
)

export const MissionSkeleton = () => (
  <div className="gg-page min-h-screen">
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="gg-glass overflow-hidden rounded-[2rem] border border-white/70">
        <SkeletonBlock className="h-64 rounded-none border-0 sm:h-80" />
        <div className="space-y-4 p-5 sm:p-6">
          <SkeletonBlock className="h-8 w-3/4 max-w-lg" />
          <SkeletonBlock className="h-4 w-1/2" />
          <div className="grid gap-3 sm:grid-cols-3">
            <SkeletonBlock className="h-16" />
            <SkeletonBlock className="h-16" />
            <SkeletonBlock className="h-16" />
          </div>
        </div>
      </section>
      <CardGridSkeleton count={3} />
    </div>
  </div>
)

export const ProfileSkeleton = () => (
  <div className="gg-page min-h-screen">
    <div className="mx-auto max-w-5xl py-6">
      <section className="gg-glass overflow-hidden rounded-3xl border border-white/70">
        <div className="border-b border-slate-200/70 bg-white/55 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <SkeletonBlock className="h-20 w-20 shrink-0 rounded-3xl" />
              <div className="min-w-0 flex-1 space-y-3">
                <SkeletonBlock className="h-3 w-36" />
                <SkeletonBlock className="h-8 w-64 max-w-full" />
                <SkeletonBlock className="h-4 w-80 max-w-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:w-72">
              <SkeletonBlock className="h-16" />
              <SkeletonBlock className="h-16" />
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
          <SkeletonBlock className="h-20" />
          <SkeletonBlock className="h-20" />
          <SkeletonBlock className="h-20" />
          <SkeletonBlock className="h-20" />
        </div>
      </section>
    </div>
  </div>
)

export const TripBoardSkeleton = () => (
  <div className="min-h-screen px-3 pb-12 pt-4 sm:px-5">
    <div className="mx-auto max-w-6xl space-y-6">
      <SkeletonBlock className="h-10 w-40" />
      <section className="gg-glass rounded-3xl border border-white/70 p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-36" />
            <SkeletonBlock className="h-10 w-3/4" />
            <SkeletonBlock className="h-4 w-1/2" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <SkeletonBlock className="h-16" />
            <SkeletonBlock className="h-16" />
            <SkeletonBlock className="h-16" />
          </div>
        </div>
      </section>
      <section className="gg-glass rounded-3xl border border-white/70 p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-32" />
            <SkeletonBlock className="h-8 w-48" />
          </div>
          <SkeletonBlock className="h-10 w-32" />
        </div>
        <CardGridSkeleton count={3} />
      </section>
    </div>
  </div>
)

export const TripOptionSkeleton = () => (
  <div className="gg-page">
    <div className="gg-container space-y-6">
      <SkeletonBlock className="h-10 w-28" />
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-sm">
        <SkeletonBlock className="h-80 rounded-none border-0" />
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <SkeletonBlock className="h-20" />
          <SkeletonBlock className="h-20" />
          <SkeletonBlock className="h-20" />
        </div>
      </section>
      <CardGridSkeleton count={3} image={false} />
    </div>
  </div>
)

export default SkeletonBlock
