import "server-only";
import { prisma } from "@/lib/prisma";
import { UserScope } from "@/generated/prisma/client";

export async function listParoquiaAdmins(institutionId: string) {
  return prisma.user.findMany({
    where: { institutionId, scope: UserScope.PAROQUIA },
    include: { permissions: true },
    orderBy: [{ isOwner: "desc" }, { createdAt: "asc" }],
  });
}
