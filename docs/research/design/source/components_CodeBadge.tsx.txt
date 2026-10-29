type CodeBadgeProps = {
  code: string;
};

export function CodeBadge({ code }: CodeBadgeProps) {
  return (
    <p className="inline-flex w-fit items-center gap-2 rounded-button bg-primary-soft px-3.5 py-2 text-sm text-primary">
      <span>كود العرض:</span>
      <span dir="ltr" className="font-bold tracking-wide">
        {code}
      </span>
    </p>
  );
}
