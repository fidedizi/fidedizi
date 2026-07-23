import {
  DollarSign,
  CreditCard,
  Wallet,
  Users,
  Heart,
  Handshake,
  Church,
  Gift,
  Megaphone,
  PartyPopper,
} from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { formatBRL } from "@/lib/format";
import { requireParoquiaContext } from "@/lib/selected-institution";
import { requireDashboardAccess } from "@/lib/permissions";
import {
  getActiveMembersCount,
  getCashCollectionsTotal,
  getDescendantInstitutionIds,
  getDigitalDonationsStats,
  getMonthlyContributionTotals,
  getPreviousMonthGrossTotal,
} from "@/lib/queries/dashboard";
import {
  getContributorsCountForMonth,
  getMonthlyTotalsByType,
  getMonthlyTrend,
  monthLabelFull,
  parseSelectedMonth,
} from "@/lib/queries/dashboard-overview";
import { getSubUnitsCount } from "@/lib/queries/sub-units";
import { MonthNavigator } from "@/components/month-navigator";
import { OverviewCard } from "@/components/overview-card";
import { MonthlyTrendChart } from "./monthly-trend-chart";
import { TypeBreakdownChart } from "./type-breakdown-chart";

function percentChange(current: number, previous: number) {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

export default async function ParoquiaDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const { user, institution: selected } = await requireParoquiaContext();
  const hasAccess = await requireDashboardAccess(user);

  if (!hasAccess) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Você não tem acesso a nenhum módulo ainda. Peça ao pároco para
        conceder permissões em Administradores.
      </div>
    );
  }

  const institutionIds = await getDescendantInstitutionIds(selected.id);
  const selectedMonth = parseSelectedMonth(await searchParams);

  const [
    totals,
    previousMonthGross,
    digitalDonations,
    cashTotal,
    activeMembers,
    subUnitsCount,
    contributorsThisMonth,
    typeTotals,
    trend,
  ] = await Promise.all([
    getMonthlyContributionTotals(institutionIds),
    getPreviousMonthGrossTotal(institutionIds),
    getDigitalDonationsStats(institutionIds),
    getCashCollectionsTotal(institutionIds),
    getActiveMembersCount(institutionIds),
    getSubUnitsCount(selected.id),
    getContributorsCountForMonth(institutionIds, selectedMonth),
    getMonthlyTotalsByType(institutionIds, selectedMonth),
    getMonthlyTrend(institutionIds, selectedMonth),
  ]);

  const totalMembers = activeMembers;

  const grossTotal = Number(totals.gross);
  const grossChange = percentChange(grossTotal, previousMonthGross);

  const typeBreakdown = [
    { label: "Dízimo", value: typeTotals.DIZIMO },
    { label: "Oferta", value: typeTotals.OFERTA },
    { label: "Campanha", value: typeTotals.CAMPANHA },
    { label: "Evento", value: typeTotals.EVENTO },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Visão geral
          </h2>
          <p className="text-base font-semibold text-slate-600">{selected.name}</p>
        </div>
        <MonthNavigator
          year={selectedMonth.year}
          month={selectedMonth.month}
          label={monthLabelFull(selectedMonth)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Total Arrecadado"
          value={formatBRL(grossTotal)}
          icon={DollarSign}
          trend={
            grossChange !== null
              ? {
                  label: `${grossChange.toFixed(1)}% vs. mês anterior`,
                  positive: grossChange >= 0,
                }
              : undefined
          }
        />
        <KpiCard
          label="Doações Digitais"
          value={formatBRL(digitalDonations.total)}
          icon={CreditCard}
          subtext={`${digitalDonations.count} transações`}
        />
        <KpiCard
          label="Espécie (Coletas)"
          value={formatBRL(cashTotal)}
          icon={Wallet}
          subtext="Lançamentos manuais"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <OverviewCard
          label="Total de Fiéis"
          value={String(totalMembers)}
          icon={Users}
          tone="gold-outline"
        />
        <OverviewCard
          label="Contribuintes"
          value={String(contributorsThisMonth)}
          icon={Handshake}
        />
        <OverviewCard
          label="Capelas Vinculadas"
          value={String(subUnitsCount)}
          icon={Church}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OverviewCard
          label="Dízimo"
          value={formatBRL(typeTotals.DIZIMO)}
          icon={Heart}
          tone="navy-fill"
        />
        <OverviewCard
          label="Oferta"
          value={formatBRL(typeTotals.OFERTA)}
          icon={Gift}
        />
        <OverviewCard
          label="Campanhas"
          value={formatBRL(typeTotals.CAMPANHA)}
          icon={Megaphone}
        />
        <OverviewCard
          label="Festas/Eventos"
          value={formatBRL(typeTotals.EVENTO)}
          icon={PartyPopper}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-base font-semibold text-slate-800">
            Evolução Mensal
          </h3>
          <MonthlyTrendChart data={trend} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-base font-semibold text-slate-800">
            Por Tipo
          </h3>
          <TypeBreakdownChart data={typeBreakdown} />
        </div>
      </div>
    </div>
  );
}
