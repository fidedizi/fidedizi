import { Fragment } from "react";
import { Eye, DollarSign, Users, TrendingUp, Building2, Church, CornerDownRight } from "lucide-react";
import { requireScope } from "@/lib/dal";
import { KpiCard } from "@/components/kpi-card";
import { MonthNavigator } from "@/components/month-navigator";
import { formatBRL } from "@/lib/format";
import { INSTITUTION_TYPE_LABELS } from "@/lib/labels";
import { UserScope } from "@/generated/prisma/client";
import {
  getActiveMembersCount,
  getDescendantInstitutionIds,
  getInstitutionCounts,
} from "@/lib/queries/dashboard";
import {
  getActiveTithersCount,
  monthLabelFull,
  parseSelectedMonth,
} from "@/lib/queries/dashboard-overview";
import {
  getInstitutionProfile,
  getMonthlyGrossTotal,
  getParoquiaBreakdown,
} from "@/lib/queries/diocese";

export default async function DioceseDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const user = await requireScope(UserScope.DIOCESE);
  const institutionId = user.institutionId!;
  const institutionIds = await getDescendantInstitutionIds(institutionId);
  const selectedMonth = parseSelectedMonth(await searchParams);

  const [profile, grossTotal, totalFieis, dizimistasAtivos, counts, paroquias] =
    await Promise.all([
      getInstitutionProfile(institutionId),
      getMonthlyGrossTotal(institutionIds, selectedMonth),
      getActiveMembersCount(institutionIds),
      getActiveTithersCount(institutionIds),
      getInstitutionCounts(institutionIds),
      getParoquiaBreakdown(institutionId, selectedMonth),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#C9A227]">
          <Eye className="h-3.5 w-3.5" /> Painel de Leitura · BI Consolidado
        </p>
        <h2 className="text-2xl font-bold text-[#0B2545]">{profile.name}</h2>
        {(profile.contactName || profile.city) && (
          <p className="text-sm text-slate-500">
            {profile.contactName && `Bispo: ${profile.contactName}`}
            {profile.contactName && profile.city && " · "}
            {profile.city &&
              `${profile.city}${profile.state ? `/${profile.state}` : ""}`}
          </p>
        )}
      </div>

      <div className="flex justify-center">
        <MonthNavigator
          year={selectedMonth.year}
          month={selectedMonth.month}
          label={monthLabelFull(selectedMonth)}
        />
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Eye className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Este painel é exclusivamente de leitura. Dados consolidados de
          todas as paróquias sob jurisdição desta diocese.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Arrecadação do Mês"
          value={formatBRL(grossTotal)}
          icon={DollarSign}
        />
        <KpiCard label="Total de Fiéis" value={String(totalFieis)} icon={Users} />
        <KpiCard
          label="Dizimistas Ativos"
          value={String(dizimistasAtivos)}
          icon={TrendingUp}
        />
        <KpiCard
          label="Paróquias Vinculadas"
          value={String(counts.PAROQUIA)}
          icon={Building2}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-800">
            Detalhamento por Paróquia
          </h3>
        </div>

        {paroquias.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Church className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">
              Nenhuma paróquia vinculada a esta diocese.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Paróquia</th>
                  <th className="px-4 py-2 font-medium">Cidade</th>
                  <th className="px-4 py-2 font-medium">Fiéis</th>
                  <th className="px-4 py-2 font-medium">Arrecadação do Mês</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {paroquias.map((paroquia) => (
                  <Fragment key={paroquia.id}>
                    <tr className="border-b border-slate-100">
                      <td className="px-4 py-2 font-semibold text-slate-800">
                        {paroquia.name}
                      </td>
                      <td className="px-4 py-2">
                        {paroquia.city
                          ? `${paroquia.city}${paroquia.state ? `/${paroquia.state}` : ""}`
                          : "—"}
                      </td>
                      <td className="px-4 py-2 font-semibold">
                        {paroquia.memberCount}
                      </td>
                      <td className="px-4 py-2 font-semibold">
                        {formatBRL(paroquia.grossTotal)}
                      </td>
                    </tr>
                    {paroquia.subUnits.map((subUnit) => (
                      <tr
                        key={subUnit.id}
                        className="border-b border-slate-100 bg-slate-50/60 text-slate-500 last:border-0"
                      >
                        <td className="px-4 py-1.5 pl-8">
                          <span className="flex items-center gap-1.5">
                            <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            {subUnit.name}
                            <span className="rounded-full border border-slate-200 px-1.5 py-0.5 text-[10px] uppercase text-slate-400">
                              {INSTITUTION_TYPE_LABELS[subUnit.type]}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-1.5">
                          {subUnit.city
                            ? `${subUnit.city}${subUnit.state ? `/${subUnit.state}` : ""}`
                            : "—"}
                        </td>
                        <td className="px-4 py-1.5">{subUnit.memberCount}</td>
                        <td className="px-4 py-1.5">
                          {formatBRL(subUnit.grossTotal)}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
