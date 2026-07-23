"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBRL } from "@/lib/format";

const SERIES_LABELS: Record<string, string> = {
  dizimo: "Dízimo",
  campanha: "Campanha",
};

type TrendPoint = { label: string; dizimo: number; campanha: number };

export function MonthlyTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickFormatter={(value: number) =>
              value >= 1000 ? `R$${value / 1000}k` : `R$${value}`
            }
          />
          <Tooltip
            formatter={(value, name) => [
              formatBRL(Number(value)),
              SERIES_LABELS[String(name)] ?? String(name),
            ]}
            contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0" }}
          />
          <Legend formatter={(value: string) => SERIES_LABELS[value] ?? value} iconType="circle" />
          <Bar
            dataKey="dizimo"
            name="dizimo"
            fill="#2563EB"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
            isAnimationActive={false}
          />
          <Bar
            dataKey="campanha"
            name="campanha"
            fill="#C9A227"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
