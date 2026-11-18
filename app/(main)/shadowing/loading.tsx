import { Skeleton } from "@/components/ui/skeleton";

export default function ShadowingLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Skeleton className="h-9 w-40 rounded-xl" />
      <Skeleton className="h-4 w-80 rounded-lg" />
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <Skeleton className="mb-4 h-64 w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
    </div>
  );
}