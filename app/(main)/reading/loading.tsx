import { Skeleton } from "@/components/ui/skeleton";

export default function ReadingLoading() {
  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-8 w-16 rounded-full" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <Skeleton className="mb-2 h-4 w-12" />
            <Skeleton className="mb-2 h-5 w-3/4" />
            <Skeleton className="mb-3 h-4 w-1/2" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}