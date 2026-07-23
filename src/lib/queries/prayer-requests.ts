import "server-only";
import { prisma } from "@/lib/prisma";

export async function listPrayerRequests(institutionId: string) {
  return prisma.prayerRequest.findMany({
    where: { institutionId },
    include: { member: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
