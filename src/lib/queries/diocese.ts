import "server-only";
import { prisma } from "@/lib/prisma";
import { ContributionStatus, InstitutionType } from "@/generated/prisma/client";
import { getDescendantInstitutionIds } from "./dashboard";
import { monthRange, type CalendarMonth } from "./dashboard-overview";

export async function getInstitutionProfile(institutionId: string) {
  return prisma.institution.findUniqueOrThrow({
    where: { id: institutionId },
    select: { name: true, contactName: true, city: true, state: true },
  });
}

export async function getMonthlyGrossTotal(
  institutionIds: string[],
  target: CalendarMonth,
) {
  const { start, end } = monthRange(target);

  const aggregate = await prisma.contribution.aggregate({
    where: {
      institutionId: { in: institutionIds },
      status: ContributionStatus.CONFIRMED,
      createdAt: { gte: start, lt: end },
    },
    _sum: { grossAmount: true },
  });

  return Number(aggregate._sum.grossAmount ?? 0);
}

export async function getParoquiaBreakdown(
  dioceseId: string,
  target: CalendarMonth,
) {
  const paroquias = await prisma.institution.findMany({
    where: { parentId: dioceseId, type: InstitutionType.PAROQUIA },
    select: { id: true, name: true, city: true, state: true },
    orderBy: { name: "asc" },
  });

  return Promise.all(
    paroquias.map(async (paroquia) => {
      const descendantIds = await getDescendantInstitutionIds(paroquia.id);
      const [grossTotal, memberCount, subUnits] = await Promise.all([
        getMonthlyGrossTotal(descendantIds, target),
        prisma.member.count({
          where: { institutionId: { in: descendantIds } },
        }),
        prisma.institution.findMany({
          where: {
            parentId: paroquia.id,
            type: { in: [InstitutionType.CAPELA, InstitutionType.COMUNIDADE] },
          },
          select: { id: true, name: true, type: true, city: true, state: true },
          orderBy: { name: "asc" },
        }),
      ]);

      const subUnitBreakdown = await Promise.all(
        subUnits.map(async (subUnit) => {
          const [subGrossTotal, subMemberCount] = await Promise.all([
            getMonthlyGrossTotal([subUnit.id], target),
            prisma.member.count({ where: { institutionId: subUnit.id } }),
          ]);

          return {
            id: subUnit.id,
            name: subUnit.name,
            type: subUnit.type,
            city: subUnit.city,
            state: subUnit.state,
            grossTotal: subGrossTotal,
            memberCount: subMemberCount,
          };
        }),
      );

      return {
        id: paroquia.id,
        name: paroquia.name,
        city: paroquia.city,
        state: paroquia.state,
        grossTotal,
        memberCount,
        subUnits: subUnitBreakdown,
      };
    }),
  );
}
