export default function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
      <div className="container-page py-12">
        {eyebrow && (
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--brand-red)]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-extrabold text-[var(--brand-blue)] sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-slate-600">{subtitle}</p>}
      </div>
    </div>
  );
}
