import type { LucideIcon } from "lucide-react";

type KpiCardProps = {
  label: string;
  value: string;
  icon?: LucideIcon;
  subtext?: string;
  trend?: { label: string; positive: boolean };
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  subtext,
  trend,
}: KpiCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-500">{label}</p>
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F5E9D6] text-[#0B2545]">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <p className="mt-1 text-2xl font-bold text-[#0B2545]">{value}</p>
      {subtext && <p className="mt-2 text-xs text-slate-400">{subtext}</p>}
      {trend && (
        <p
          className={`text-xs font-medium ${trend.positive ? "text-emerald-600" : "text-red-600"} ${subtext ? "mt-0.5" : "mt-2"}`}
        >
          {trend.positive ? "↗" : "↘"} {trend.label}
        </p>
      )}
    </div>
  );
}
