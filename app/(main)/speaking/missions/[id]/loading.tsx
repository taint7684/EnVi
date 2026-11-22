import { SkeletonCard } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl py-6">
      <SkeletonCard />
    </div>
  );
}