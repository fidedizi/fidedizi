import "server-only";
import { prisma } from "@/lib/prisma";
import { MessageTrigger } from "@/generated/prisma/client";

const ALL_TRIGGERS = Object.values(MessageTrigger) as MessageTrigger[];

export async function listMessageTemplates(institutionId: string) {
  const templates = await prisma.messageTemplate.findMany({
    where: { institutionId },
  });

  const byTrigger = new Map(templates.map((t) => [t.trigger, t.body]));

  return ALL_TRIGGERS.map((trigger) => ({
    trigger,
    body: byTrigger.get(trigger) ?? "",
  }));
}

export async function listMessageSchedules(institutionId: string) {
  return prisma.messageSchedule.findMany({
    where: { institutionId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
