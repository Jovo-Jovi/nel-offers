export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`nel-shimmer motion-reduce:animate-none rounded-card bg-primary-soft ${className}`} />;
}
