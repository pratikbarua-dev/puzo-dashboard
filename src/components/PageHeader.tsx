export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-headline-lg">{title}</h1>
        {subtitle && <p className="mt-1 text-label-caps text-on-surface-variant">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
