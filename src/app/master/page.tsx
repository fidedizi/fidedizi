import {
  Landmark,
  Building,
  Building2,
  Home,
  TrendingUp,
  DollarSign,
  Percent,
  Wallet,
} from "lucide-react";
import { requireScope } from "@/lib/dal";
import { KpiCard } from "@/components/kpi-card";
import { OverviewCard } from "@/components/overview-card";
import { MonthNavigator } from "@/components/month-navigator";
import { formatBRL } from "@/lib/format";
import { INSTITUTION_TYPE_LABELS } from "@/lib/labels";
import { UserScope } from "@/generated/prisma/client";
import {
  monthLabelFull,
  parseSelectedMonth,
} from "@/lib/queries/dashboard-overview";
import {
  getInstitutionMonitoring,
  getMasterInstitutionCounts,
  getMasterMonthlyTotals,
  getRevenueByType,
} from "@/lib/queries/master";

const REVENUE_LINES = [
  { type: "DIZIMO", label: "Dízimo", color: "#2563EB" },
  { type: "OFERTA", label: "Oferta", color: "#10B981" },
  { type: "CAMPANHA", label: "Campanhas", color: "#C9A227" },
  { type: "EVENTO", label: "Festas/Eventos", color: "#8B5CF6" },
] as const;

export default async function MasterDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  await requireScope(UserScope.MASTER);
  const selectedMonth = parseSelectedMonth(await searchParams);

  const [counts, totals, monitoring, revenueByType] = await Promise.all([
    getMasterInstitutionCounts(),
    getMasterMonthlyTotals(selectedMonth),
    getInstitutionMonitoring(selectedMonth),
    getRevenueByType(selectedMonth),
  ]);

  const maxRevenue = Math.max(
    ...REVENUE_LINES.map((line) => revenueByType[line.type].total),
    1,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C9A227] text-[#0B2545]">
            <Landmark className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-bold text-[#0B2545]">Painel Master</h2>
        </div>
        <p className="text-sm text-slate-500">
          Visão consolidada do ecossistema FideDizi
        </p>
      </div>

      <MonthNavigator
        year={selectedMonth.year}
        month={selectedMonth.month}
        label={monthLabelFull(selectedMonth)}
        variant="wide"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="Arquidioceses"
          value={String(counts.ARQUIDIOCESE.total)}
          icon={Landmark}
          subtext="vinculadas"
        />
        <KpiCard
          label="Dioceses"
          value={String(counts.DIOCESE.total)}
          icon={Building}
          subtext={`${counts.DIOCESE.active} ativas`}
        />
        <KpiCard
          label="Paróquias"
          value={String(counts.PAROQUIA.total)}
          icon={Building2}
          subtext={`${counts.PAROQUIA.active} ativas`}
        />
        <KpiCard
          label="Capelas/Comunidades"
          value={String(counts.CAPELA.total + counts.COMUNIDADE.total)}
          icon={Home}
          subtext={`${counts.CAPELA.active + counts.COMUNIDADE.active} ativas`}
        />
        <OverviewCard
          label="Arrecadação do Mês"
          value={formatBRL(totals.gross)}
          icon={TrendingUp}
          tone="gold-fill"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <OverviewCard
          label="Valor Bruto Arrecadado"
          value={formatBRL(totals.gross)}
          icon={DollarSign}
        />
        <OverviewCard
          label="Comissão FideDizi"
          value={formatBRL(totals.fee)}
          icon={Percent}
          tone="gold-outline"
        />
        <OverviewCard
          label="Líquido para Instituições"
          value={formatBRL(totals.net)}
          icon={Wallet}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-800">
            Monitoramento por Instituição
          </h3>
        </div>

        {monitoring.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">
            Nenhuma instituição arrecadadora cadastrada ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Instituição</th>
                  <th className="px-4 py-2 font-medium">Bruto</th>
                  <th className="px-4 py-2 font-medium">Taxa</th>
                  <th className="px-4 py-2 font-medium">Comissão FideDizi</th>
                  <th className="px-4 py-2 font-medium">Líquido</th>
                  <th className="px-4 py-2 font-medium">Dizimistas Ativos</th>
                  <th className="px-4 py-2 font-medium">Contribuintes</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {monitoring.map((institution) => (
                  <tr
                    key={institution.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5E9D6] text-[#0B2545]">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {institution.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {INSTITUTION_TYPE_LABELS[institution.type]}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {formatBRL(institution.grossTotal)}
                    </td>
                    <td className="px-4 py-2">
                      {institution.commissionRate.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2 text-[#C9A227]">
                      {formatBRL(institution.feeTotal)}
                    </td>
                    <td className="px-4 py-2 text-emerald-600">
                      {formatBRL(institution.netTotal)}
                    </td>
                    <td className="px-4 py-2">
                      {institution.activeTithersCount}
                    </td>
                    <td className="px-4 py-2">
                      {institution.contributorsThisMonth}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-800">
          Detalhamento por Linha de Receita
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {REVENUE_LINES.map((line) => {
            const revenue = revenueByType[line.type];
            const pct = (revenue.total / maxRevenue) * 100;
            return (
              <div
                key={line.type}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: line.color }}
                  />
                  {line.label}
                </div>
                <p className="mt-1 text-xl font-bold text-[#0B2545]">
                  {formatBRL(revenue.total)}
                </p>
                <p className="text-xs text-slate-400">
                  {revenue.count} transação(ões)
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: line.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
