import { requireParoquiaContext } from "@/lib/selected-institution";
import { requirePermission } from "@/lib/permissions";
import { PermissionModule } from "@/generated/prisma/client";
import { getDescendantInstitutionIds } from "@/lib/queries/dashboard";
import {
  monthLabelFull,
  parseSelectedMonth,
} from "@/lib/queries/dashboard-overview";
import { getMonthlyReport } from "@/lib/queries/reports";
import { ReportSection } from "./report-section";

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const { user, institution } = await requireParoquiaContext();
  await requirePermission(user, PermissionModule.FINANCEIRO);
  const institutionIds = await getDescendantInstitutionIds(institution.id);
  const selectedMonth = parseSelectedMonth(await searchParams);

  const report = await getMonthlyReport(institutionIds, selectedMonth);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Relatórios</h2>
        <p className="text-sm text-slate-500">Prestação de contas mensal</p>
      </div>

      <ReportSection
        year={selectedMonth.year}
        month={selectedMonth.month}
        monthLabel={monthLabelFull(selectedMonth)}
        institutionName={institution.name}
        data={{
          totalGross: report.totalGross,
          digitalTotal: report.digitalTotal,
          cashTotal: report.cashTotal,
          titherCount: report.titherCount,
          transactionCount: report.transactionCount,
          typeTotals: {
            DIZIMO: report.typeTotals.DIZIMO,
            OFERTA: report.typeTotals.OFERTA,
            CAMPANHA: report.typeTotals.CAMPANHA,
          },
          digital: report.digital,
        }}
      />
    </div>
  );
}
