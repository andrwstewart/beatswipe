export default function DiscoverLoading() {
  return (
    <div className="min-h-dvh px-4" style={{ paddingTop: 'calc(3.5rem + env(safe-area-inset-top, 0px))', paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="h-10 bg-white/10 rounded-xl animate-pulse mb-6" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square bg-white/10 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>
  )
}
