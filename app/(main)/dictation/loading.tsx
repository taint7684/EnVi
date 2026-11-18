import { Skeleton } from "@/components/ui/skeleton";

export default function DictationLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Skeleton className="h-9 w-52 rounded-xl" />
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <Skeleton className="mb-4 h-4 w-24" />
        <Skeleton className="mb-4 h-9 w-28" />
        <Skeleton className="mb-3 h-12 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}