import "server-only";
import { prisma } from "@/lib/prisma";
import {
  ContributionStatus,
  ContributionType,
  InstitutionStatus,
  InstitutionType,
} from "@/generated/prisma/client";
import { getEffectiveCommissionRate } from "@/lib/split";
import { monthRange, type CalendarMonth } from "./dashboard-overview";

export async function getMasterInstitutionCounts() {
  const [totals, actives] = await Promise.all([
    prisma.institution.groupBy({ by: ["type"], _count: { _all: true } }),
    prisma.institution.groupBy({
      by: ["type"],
      where: { status: InstitutionStatus.ACTIVE },
      _count: { _all: true },
    }),
  ]);

  const result: Record<InstitutionType, { total: number; active: number }> = {
    ARQUIDIOCESE: { total: 0, active: 0 },
    DIOCESE: { total: 0, active: 0 },
    PAROQUIA: { total: 0, active: 0 },
    CAPELA: { total: 0, active: 0 },
    COMUNIDADE: { total: 0, active: 0 },
  };
  for (const t of totals) result[t.type].total = t._count._all;
  for (const a of actives) result[a.type].active = a._count._all;
  return result;
}

export async function getMasterMonthlyTotals(target: CalendarMonth) {
  const { start, end } = monthRange(target);

  const aggregate = await prisma.contribution.aggregate({
    where: {
      status: ContributionStatus.CONFIRMED,
      createdAt: { gte: start, lt: end },
    },
    _sum: { grossAmount: true, feeAmount: true, netAmount: true },
  });

  return {
    gross: Number(aggregate._sum.grossAmount ?? 0),
    fee: Number(aggregate._sum.feeAmount ?? 0),
    net: Number(aggregate._sum.netAmount ?? 0),
  };
}

export async function getRevenueByType(target: CalendarMonth) {
  const { start, end } = monthRange(target);

  const groups = await prisma.contribution.groupBy({
    by: ["type"],
    where: {
      status: ContributionStatus.CONFIRMED,
      createdAt: { gte: start, lt: end },
    },
    _sum: { grossAmount: true },
    _count: { _all: true },
  });

  const result: Record<ContributionType, { total: number; count: number }> = {
    DIZIMO: { total: 0, count: 0 },
    OFERTA: { total: 0, count: 0 },
    CAMPANHA: { total: 0, count: 0 },
    EVENTO: { total: 0, count: 0 },
  };
  for (const g of groups) {
    result[g.type] = {
      total: Number(g._sum.grossAmount ?? 0),
      count: g._count._all,
    };
  }
  return result;
}

// Cada paróquia/capela/comunidade arrecada e é comissionada individualmente,
// então o monitoramento é por instituição, sem somar filhas dentro do pai.
export async function getInstitutionMonitoring(target: CalendarMonth) {
  const { start, end } = monthRange(target);

  const institutions = await prisma.institution.findMany({
    where: {
      type: {
        in: [
          InstitutionType.PAROQUIA,
          InstitutionType.CAPELA,
          InstitutionType.COMUNIDADE,
        ],
      },
    },
    select: { id: true, name: true, type: true },
    orderBy: { name: "asc" },
  });

  return Promise.all(
    institutions.map(async (institution) => {
      const [aggregate, commissionRate, activeTithers, contributorsThisMonth] =
        await Promise.all([
          prisma.contribution.aggregate({
            where: {
              institutionId: institution.id,
              status: ContributionStatus.CONFIRMED,
              createdAt: { gte: start, lt: end },
            },
            _sum: { grossAmount: true, feeAmount: true, netAmount: true },
          }),
          getEffectiveCommissionRate(institution.id),
          prisma.contribution.findMany({
            where: {
              institutionId: institution.id,
              status: ContributionStatus.CONFIRMED,
              type: ContributionType.DIZIMO,
              memberId: { not: null },
            },
            distinct: ["memberId"],
            select: { memberId: true },
          }),
          prisma.contribution.findMany({
            where: {
              institutionId: institution.id,
              status: ContributionStatus.CONFIRMED,
              createdAt: { gte: start, lt: end },
              memberId: { not: null },
            },
            distinct: ["memberId"],
            select: { memberId: true },
          }),
        ]);

      return {
        id: institution.id,
        name: institution.name,
        type: institution.type,
        grossTotal: Number(aggregate._sum.grossAmount ?? 0),
        feeTotal: Number(aggregate._sum.feeAmount ?? 0),
        netTotal: Number(aggregate._sum.netAmount ?? 0),
        commissionRate,
        activeTithersCount: activeTithers.length,
        contributorsThisMonth: contributorsThisMonth.length,
      };
    }),
  );
}
