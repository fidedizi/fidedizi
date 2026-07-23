import type { LucideIcon } from "lucide-react";

type Tone = "default" | "gold-outline" | "navy-fill" | "gold-fill";

export function OverviewCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  const isNavyFill = tone === "navy-fill";
  const isGoldFill = tone === "gold-fill";
  const isGoldOutline = tone === "gold-outline";

  return (
    <div
      className={`rounded-xl p-4 shadow-sm transition-shadow hover:shadow-md ${
        isNavyFill
          ? "bg-[#0B2545]"
          : isGoldFill
            ? "bg-[#C9A227]"
            : isGoldOutline
              ? "border border-[#C9A227] bg-white"
              : "border border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={`text-sm ${isNavyFill ? "text-white/70" : isGoldFill ? "text-[#0B2545]/70" : "text-slate-500"}`}
        >
          {label}
        </p>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            isGoldFill ? "bg-[#0B2545] text-white" : "bg-[#F5E9D6] text-[#0B2545]"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p
        className={`mt-2 text-2xl font-bold ${
          isNavyFill
            ? "text-white"
            : isGoldOutline
              ? "text-[#C9A227]"
              : "text-[#0B2545]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
