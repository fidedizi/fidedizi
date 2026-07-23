import "server-only";
import { prisma } from "@/lib/prisma";
import {
  ContributionStatus,
  ContributionMethod,
  InstitutionType,
} from "@/generated/prisma/client";

// A hierarquia (Arquidiocese/Diocese > Paróquia > Capela/Comunidade) tem poucos
// níveis, então uma busca em largura resolve os descendentes sem precisar de
// uma CTE recursiva.
export async function getDescendantInstitutionIds(rootId: string) {
  const ids = [rootId];
  let frontier = [rootId];

  while (frontier.length > 0) {
    const children = await prisma.institution.findMany({
      where: { parentId: { in: frontier } },
      select: { id: true },
    });
    if (children.length === 0) break;
    frontier = children.map((c) => c.id);
    ids.push(...frontier);
  }

  return ids;
}

export async function getInstitutionCounts(institutionIds: string[]) {
  const counts = await prisma.institution.groupBy({
    by: ["type"],
    where: { id: { in: institutionIds } },
    _count: { _all: true },
  });

  const result: Record<InstitutionType, number> = {
    ARQUIDIOCESE: 0,
    DIOCESE: 0,
    PAROQUIA: 0,
    CAPELA: 0,
    COMUNIDADE: 0,
  };
  for (const c of counts) result[c.type] = c._count._all;
  return result;
}

export async function getMonthlyContributionTotals(institutionIds: string[]) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const aggregate = await prisma.contribution.aggregate({
    where: {
      institutionId: { in: institutionIds },
      status: ContributionStatus.CONFIRMED,
      createdAt: { gte: startOfMonth },
    },
    _sum: { grossAmount: true, feeAmount: true, netAmount: true },
  });

  return {
    gross: aggregate._sum.grossAmount ?? 0,
    fee: aggregate._sum.feeAmount ?? 0,
    net: aggregate._sum.netAmount ?? 0,
  };
}

export async function getActiveMembersCount(institutionIds: string[]) {
  return prisma.member.count({
    where: { institutionId: { in: institutionIds } },
  });
}

export async function getPreviousMonthGrossTotal(institutionIds: string[]) {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPreviousMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1,
  );

  const aggregate = await prisma.contribution.aggregate({
    where: {
      institutionId: { in: institutionIds },
      status: ContributionStatus.CONFIRMED,
      createdAt: { gte: startOfPreviousMonth, lt: startOfThisMonth },
    },
    _sum: { grossAmount: true },
  });

  return Number(aggregate._sum.grossAmount ?? 0);
}

export async function getDigitalDonationsStats(institutionIds: string[]) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const aggregate = await prisma.contribution.aggregate({
    where: {
      institutionId: { in: institutionIds },
      status: ContributionStatus.CONFIRMED,
      method: { in: [ContributionMethod.PIX, ContributionMethod.CARTAO] },
      createdAt: { gte: startOfMonth },
    },
    _sum: { grossAmount: true },
    _count: { _all: true },
  });

  return {
    total: Number(aggregate._sum.grossAmount ?? 0),
    count: aggregate._count._all,
  };
}

export async function getCashCollectionsTotal(institutionIds: string[]) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const aggregate = await prisma.contribution.aggregate({
    where: {
      institutionId: { in: institutionIds },
      status: ContributionStatus.CONFIRMED,
      method: ContributionMethod.ESPECIE,
      createdAt: { gte: startOfMonth },
    },
    _sum: { grossAmount: true },
  });

  return Number(aggregate._sum.grossAmount ?? 0);
}

export async function getContributorsCount(institutionIds: string[]) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const distinctContributors = await prisma.contribution.findMany({
    where: {
      institutionId: { in: institutionIds },
      status: ContributionStatus.CONFIRMED,
      createdAt: { gte: startOfMonth },
      memberId: { not: null },
    },
    distinct: ["memberId"],
    select: { memberId: true },
  });

  return distinctContributors.length;
}
