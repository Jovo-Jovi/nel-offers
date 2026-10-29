import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-10 w-28" />
    </div>
  );
}
