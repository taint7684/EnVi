export function PlaceholderPage({
  title,
  phase,
  children,
}: {
  title: string;
  phase: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-muted-foreground">{children}</p>
      <p className="mt-4 inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
        {phase}
      </p>
    </div>
  );
}