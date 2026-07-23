"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function MonthNavigator({
  year,
  month,
  label,
  variant = "compact",
}: {
  year: number;
  month: number;
  label: string;
  variant?: "compact" | "wide";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(delta: number) {
    const date = new Date(year, month - 1 + delta, 1);
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", String(date.getFullYear()));
    params.set("month", String(date.getMonth() + 1));
    router.push(`${pathname}?${params.toString()}`);
  }

  if (variant === "wide") {
    return (
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Mês anterior"
          className="text-sm text-slate-500 transition hover:text-[#0B2545]"
        >
          ‹ Anterior
        </button>
        <span className="text-sm font-semibold text-[#0B2545]">{label}</span>
        <button
          type="button"
          onClick={() => navigate(1)}
          aria-label="Próximo mês"
          className="text-sm text-slate-500 transition hover:text-[#0B2545]"
        >
          Próximo ›
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-fit items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Mês anterior"
        className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[9rem] text-center text-sm font-semibold text-[#0B2545]">
        {label}
      </span>
      <button
        type="button"
        onClick={() => navigate(1)}
        aria-label="Próximo mês"
        className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
