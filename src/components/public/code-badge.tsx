import { LatinRun } from "@/components/latin-run";

type CodeBadgeProps = {
  label: string;
  code: string;
};

export function CodeBadge({ label, code }: CodeBadgeProps) {
  return (
    <p className="inline-flex w-fit items-center gap-2 rounded-button bg-primary-soft px-3.5 py-2 text-sm text-primary">
      <span>{label}</span>
      <span className="font-bold tracking-wide">
        <LatinRun>{code}</LatinRun>
      </span>
    </p>
  );
}
