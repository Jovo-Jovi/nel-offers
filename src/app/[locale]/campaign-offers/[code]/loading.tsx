import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Skeleton className="h-16 rounded-none" />
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1.15fr)_22rem]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="aspect-[16/10]" />
        </div>
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
