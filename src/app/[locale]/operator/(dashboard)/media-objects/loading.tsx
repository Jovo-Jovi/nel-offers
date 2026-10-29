import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-28" />
      <Skeleton className="h-16" />
    </div>
  );
}
