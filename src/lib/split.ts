import "server-only";
import { prisma } from "@/lib/prisma";

export async function getEffectiveCommissionRate(
  institutionId: string,
): Promise<number> {
  let currentId: string | null = institutionId;

  while (currentId) {
    const config = await prisma.splitConfig.findUnique({
      where: { institutionId: currentId },
      select: { commissionRate: true },
    });
    if (config) return Number(config.commissionRate);

    const institution: { parentId: string | null } | null =
      await prisma.institution.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });
    currentId = institution?.parentId ?? null;
  }

  return 0;
}

export async function calculateSplit(grossAmount: number, institutionId: string) {
  const commissionRate = await getEffectiveCommissionRate(institutionId);
  const feeAmount = Math.round(grossAmount * (commissionRate / 100) * 100) / 100;
  const netAmount = Math.round((grossAmount - feeAmount) * 100) / 100;
  return { feeAmount, netAmount };
}
