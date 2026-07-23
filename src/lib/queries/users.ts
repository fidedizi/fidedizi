import "server-only";
import { prisma } from "@/lib/prisma";

export async function listAllUsers() {
  return prisma.user.findMany({
    include: {
      institution: {
        select: {
          id: true,
          name: true,
          type: true,
          parent: {
            select: {
              id: true,
              name: true,
              type: true,
              parent: { select: { id: true, name: true, type: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
