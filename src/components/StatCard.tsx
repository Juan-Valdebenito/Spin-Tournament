import type { LucideIcon } from "lucide-react";

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: "accent" | "success" | "primary";
}) {
  const iconColor =
    accent === "accent" ? "text-accent" : accent === "success" ? "text-success" : "text-primary";

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="label-mono text-xs font-semibold uppercase text-muted">{label}</p>
        <Icon size={20} className={`${iconColor} opacity-70`} />
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
