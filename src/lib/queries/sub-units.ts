import "server-only";
import { prisma } from "@/lib/prisma";
import { InstitutionType } from "@/generated/prisma/client";
import {
  getActiveMembersCount,
  getContributorsCount,
  getMonthlyContributionTotals,
} from "@/lib/queries/dashboard";

export async function listSubUnitsWithStats(parentId: string) {
  const subUnits = await prisma.institution.findMany({
    where: {
      parentId,
      type: { in: [InstitutionType.CAPELA, InstitutionType.COMUNIDADE] },
    },
    orderBy: { name: "asc" },
  });

  return Promise.all(
    subUnits.map(async (unit) => {
      const [totals, members, contributors] = await Promise.all([
        getMonthlyContributionTotals([unit.id]),
        getActiveMembersCount([unit.id]),
        getContributorsCount([unit.id]),
      ]);

      return {
        ...unit,
        monthlyGross: Number(totals.gross),
        members,
        contributors,
      };
    }),
  );
}

export async function getSubUnitById(subUnitId: string, parentId: string) {
  return prisma.institution.findFirst({
    where: { id: subUnitId, parentId },
  });
}

export async function getSubUnitsCount(parentId: string) {
  return prisma.institution.count({
    where: {
      parentId,
      type: { in: [InstitutionType.CAPELA, InstitutionType.COMUNIDADE] },
    },
  });
}

// Paróquia + suas capelas/comunidades, para o seletor de "Local" no menu.
export async function listSelectableLocations(parentId: string) {
  const [parent, children] = await Promise.all([
    prisma.institution.findUnique({
      where: { id: parentId },
      select: { id: true, name: true, type: true },
    }),
    prisma.institution.findMany({
      where: {
        parentId,
        type: { in: [InstitutionType.CAPELA, InstitutionType.COMUNIDADE] },
      },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return parent ? [...children, parent] : children;
}
