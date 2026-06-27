export default function FeedLoading() {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-end pb-32 gap-4">
      {/* Fake waveform bars */}
      <div className="w-full px-8 flex gap-1 items-end justify-center h-[72px]">
        {[30, 45, 20, 55, 35, 50, 25, 60, 40, 15, 50, 35, 55, 28, 48, 22, 56, 38, 44, 18].map((h, i) => (
          <div
            key={i}
            className="w-[2px] bg-white/10 rounded-full animate-pulse"
            style={{ height: `${h}px`, animationDelay: `${i * 40}ms` }}
          />
        ))}
      </div>
      {/* Fake title + tag */}
      <div className="flex flex-col gap-2 w-48">
        <div className="h-5 bg-white/10 rounded-lg animate-pulse" />
        <div className="h-3 w-28 bg-white/10 rounded-lg animate-pulse" />
      </div>
    </div>
  )
}
