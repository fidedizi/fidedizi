import "server-only";
import { prisma } from "@/lib/prisma";

export async function listMassSchedules(institutionId: string) {
  return prisma.massSchedule.findMany({
    where: { institutionId },
    orderBy: [{ dayOfWeek: "asc" }, { time: "asc" }],
  });
}
