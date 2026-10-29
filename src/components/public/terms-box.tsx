type TermsBoxProps = {
  heading: string;
  body: string;
};

export function TermsBox({ heading, body }: TermsBoxProps) {
  return (
    <section className="text-start">
      <h2 className="text-sm font-bold text-dark">{heading}</h2>
      <p className="mt-3 min-h-28 rounded-card bg-primary-soft px-4 py-4 text-sm leading-relaxed text-dark">{body}</p>
    </section>
  );
}
