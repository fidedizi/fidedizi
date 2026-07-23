import "server-only";
import { prisma } from "@/lib/prisma";

export async function listMembers(institutionId: string) {
  return prisma.member.findMany({
    where: { institutionId },
    orderBy: { name: "asc" },
    include: { flags: { include: { flag: true } } },
  });
}

export async function listMemberSearchOptions(institutionId: string) {
  return prisma.member.findMany({
    where: { institutionId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, whatsapp: true, email: true },
  });
}

export async function listFlags(institutionId: string) {
  return prisma.flag.findMany({
    where: { institutionId },
    orderBy: { name: "asc" },
  });
}

export async function getMemberById(memberId: string, institutionId: string) {
  return prisma.member.findFirst({
    where: { id: memberId, institutionId },
    include: { flags: { include: { flag: true } } },
  });
}

export async function listMemberMessages(memberId: string) {
  return prisma.memberMessage.findMany({
    where: { memberId },
    orderBy: { sentAt: "desc" },
  });
}
