export default function MessagesLoading() {
  return (
    <div className="min-h-dvh" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="px-4 pb-4 border-b border-border" style={{ paddingTop: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}>
        <div className="h-6 w-28 bg-white/10 rounded-lg animate-pulse" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-48 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
