import "server-only";
import { prisma } from "@/lib/prisma";
import {
  ContributionMethod,
  ContributionStatus,
  ContributionType,
} from "@/generated/prisma/client";
import { monthRange, type CalendarMonth } from "./dashboard-overview";

export async function getMonthlyReport(
  institutionIds: string[],
  target: CalendarMonth,
) {
  const { start, end } = monthRange(target);
  const baseWhere = {
    institutionId: { in: institutionIds },
    status: ContributionStatus.CONFIRMED,
    createdAt: { gte: start, lt: end },
  };

  const [totalAgg, transactionCount, distinctTithers, typeGroups, methodGroups] =
    await Promise.all([
      prisma.contribution.aggregate({
        where: baseWhere,
        _sum: { grossAmount: true },
      }),
      prisma.contribution.count({ where: baseWhere }),
      prisma.contribution.findMany({
        where: {
          ...baseWhere,
          type: ContributionType.DIZIMO,
          memberId: { not: null },
        },
        distinct: ["memberId"],
        select: { memberId: true },
      }),
      prisma.contribution.groupBy({
        by: ["type"],
        where: baseWhere,
        _sum: { grossAmount: true },
      }),
      prisma.contribution.groupBy({
        by: ["method", "isRecurring"],
        where: baseWhere,
        _sum: { grossAmount: true },
      }),
    ]);

  const typeTotals: Record<ContributionType, number> = {
    DIZIMO: 0,
    OFERTA: 0,
    CAMPANHA: 0,
    EVENTO: 0,
  };
  for (const group of typeGroups) {
    typeTotals[group.type] = Number(group._sum.grossAmount ?? 0);
  }

  let pix = 0;
  let cartao = 0;
  let recorrente = 0;
  let digitalTotal = 0;
  let cashTotal = 0;

  for (const group of methodGroups) {
    const amount = Number(group._sum.grossAmount ?? 0);
    if (group.method === ContributionMethod.ESPECIE) {
      cashTotal += amount;
      continue;
    }
    digitalTotal += amount;
    if (group.isRecurring) {
      recorrente += amount;
    } else if (group.method === ContributionMethod.PIX) {
      pix += amount;
    } else if (group.method === ContributionMethod.CARTAO) {
      cartao += amount;
    }
  }

  return {
    totalGross: Number(totalAgg._sum.grossAmount ?? 0),
    digitalTotal,
    cashTotal,
    titherCount: distinctTithers.length,
    transactionCount,
    typeTotals,
    digital: { pix, cartao, recorrente },
  };
}
