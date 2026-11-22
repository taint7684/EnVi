import { SkeletonCard } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl py-12">
      <SkeletonCard className="mb-4" />
      <SkeletonCard className="mb-4" />
      <SkeletonCard />
    </div>
  );
}