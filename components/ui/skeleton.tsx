export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-muted ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-4 shadow-sm ${className}`}
    >
      <Skeleton className="h-4 w-3/4 mb-3" />
      <Skeleton className="h-8 w-1/2 mb-2" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-9 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="flex h-32 items-end justify-between gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="flex-1" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonVocab() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 text-center">
        <Skeleton className="h-8 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="aspect-[3/2] rounded-xl bg-muted mb-4" />
        <Skeleton className="h-6 w-32 mx-auto mb-2" />
        <Skeleton className="h-4 w-48 mx-auto mb-4" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonSpeaking() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 text-center">
        <Skeleton className="h-8 w-56 mx-auto mb-2" />
        <Skeleton className="h-4 w-72 mx-auto" />
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 flex-1" />
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}