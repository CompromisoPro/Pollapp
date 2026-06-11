export default function PageHeader({
  title,
  subtitle,
  emoji,
}: {
  title: string;
  subtitle?: string;
  emoji?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
        {emoji && <span>{emoji}</span>}
        <span className="text-grad">{title}</span>
      </h1>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
