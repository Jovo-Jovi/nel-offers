export function OperatorMark({ alt }: { alt: string }) {
  return (
    // CSP has no style-src, and next/image writes an inline style.
    // eslint-disable-next-line @next/next/no-img-element
    <img className="h-10 w-auto" src="/mark/nel-mark.png" alt={alt} width={537} height={752} />
  );
}
