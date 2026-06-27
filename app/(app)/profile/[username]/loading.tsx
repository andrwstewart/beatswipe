export default function ProfileLoading() {
  return (
    <div className="min-h-dvh" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      {/* Banner */}
      <div className="h-36 bg-white/10 animate-pulse" />
      {/* Avatar + name */}
      <div className="px-4 -mt-10 flex flex-col gap-3">
        <div className="w-20 h-20 rounded-full bg-white/20 animate-pulse border-4 border-background" />
        <div className="h-5 w-36 bg-white/10 rounded animate-pulse" />
        <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
      </div>
      {/* Beat grid skeleton */}
      <div className="px-4 mt-6 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-square bg-white/10 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>
  )
}
