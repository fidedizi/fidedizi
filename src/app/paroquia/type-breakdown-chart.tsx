"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatBRL } from "@/lib/format";

const COLORS: Record<string, string> = {
  Dízimo: "#2563EB",
  Oferta: "#10B981",
  Campanha: "#C9A227",
  Evento: "#8B5CF6",
};

type Slice = { label: string; value: number };

export function TypeBreakdownChart({ data }: { data: Slice[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <p className="flex h-48 items-center justify-center text-sm text-slate-400">
        Nenhum lançamento neste mês.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="65%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((entry) => (
                <Cell key={entry.label} fill={COLORS[entry.label]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatBRL(Number(value))}
              contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-col gap-2">
        {data.map((entry) => (
          <li key={entry.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[entry.label] }}
            />
            <span className="text-slate-700">{entry.label}</span>
            <span className="ml-auto font-medium text-slate-800">
              {formatBRL(entry.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
