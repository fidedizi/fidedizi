import "server-only";
import { prisma } from "@/lib/prisma";

export async function listAllInstitutions() {
  return prisma.institution.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
    include: {
      parent: { select: { id: true, name: true } },
      splitConfig: true,
      receiver: true,
    },
  });
}
