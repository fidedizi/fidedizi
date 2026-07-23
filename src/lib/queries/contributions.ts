import "server-only";
import { prisma } from "@/lib/prisma";
import type {
  ContributionType,
  ContributionStatus,
} from "@/generated/prisma/client";

export type ContributionFilters = {
  search?: string;
  type?: ContributionType;
  status?: ContributionStatus;
  dateFrom?: string;
  dateTo?: string;
};

export async function listRecentContributions(
  institutionId: string,
  filters: ContributionFilters = {},
  take = 50,
) {
  const { search, type, status, dateFrom, dateTo } = filters;

  return prisma.contribution.findMany({
    where: {
      institutionId,
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { member: { name: { contains: search, mode: "insensitive" } } },
              { buyerName: { contains: search, mode: "insensitive" } },
              { member: { whatsapp: { contains: search } } },
              { buyerPhone: { contains: search } },
            ],
          }
        : {}),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999`) } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      member: { select: { name: true, whatsapp: true } },
      campaign: { select: { title: true } },
      tickets: {
        take: 1,
        select: { event: { select: { title: true } } },
      },
    },
  });
}

export async function listContributionsByMember(memberId: string) {
  return prisma.contribution.findMany({
    where: { memberId },
    orderBy: { createdAt: "desc" },
    include: {
      campaign: { select: { title: true } },
    },
  });
}

export async function getContributionForReceipt(
  contributionId: string,
  institutionId: string,
) {
  return prisma.contribution.findFirst({
    where: { id: contributionId, institutionId },
    include: {
      institution: { select: { name: true } },
      member: { select: { name: true, whatsapp: true } },
      campaign: { select: { title: true } },
    },
  });
}
