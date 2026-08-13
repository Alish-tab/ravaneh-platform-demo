type PagePlaceholderProps = {
  title: string;
  description: string;
};

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-3 p-6">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{title}</h1>
      <p className="text-sm leading-7 text-[var(--text-secondary)]">{description}</p>
    </section>
  );
}
