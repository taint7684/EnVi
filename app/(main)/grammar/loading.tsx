import { Skeleton } from "@/components/ui/skeleton";

export default function GrammarLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Skeleton className="h-9 w-56 rounded-xl" />
      <Skeleton className="h-4 w-72 rounded-lg" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <Skeleton className="mb-3 h-6 w-40" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}