import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
      <Skeleton className="h-32" />
    </div>
  );
}
