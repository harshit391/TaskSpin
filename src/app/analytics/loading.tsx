export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="sticky top-0 z-10 bg-bg-primary/80 backdrop-blur-md border-b border-border">
        <div className="w-[92%] sm:w-[88%] lg:w-[85%] max-w-4xl mx-auto flex items-center gap-3 py-4">
          <div className="w-[44px] h-[44px]" />
          <div className="h-6 w-24 bg-bg-secondary rounded animate-pulse" />
        </div>
      </div>
      <div className="w-[92%] sm:w-[88%] lg:w-[85%] max-w-4xl mx-auto py-6">
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-accent" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
          </svg>
        </div>
      </div>
    </div>
  );
}
