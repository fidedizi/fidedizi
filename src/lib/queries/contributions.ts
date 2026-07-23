import "server-only";
import { prisma } from "@/lib/prisma";

export async function listRecentContributions(institutionId: string, take = 20) {
  return prisma.contribution.findMany({
    where: { institutionId },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      member: { select: { name: true, whatsapp: true } },
      campaign: { select: { title: true } },
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
