import { Skeleton } from "@/components/ui/skeleton";

export default function ProgressTestLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Skeleton className="h-9 w-48 rounded-xl" />
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <Skeleton className="mb-4 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-3/4" />
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}