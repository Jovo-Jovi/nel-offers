import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Skeleton className="h-16 rounded-none" />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <Skeleton className="h-64 sm:h-80" />
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    </div>
  );
}
