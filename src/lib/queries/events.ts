import "server-only";
import { prisma } from "@/lib/prisma";
import { TicketStatus } from "@/generated/prisma/client";

export async function listEventsWithStats(institutionId: string) {
  const events = await prisma.event.findMany({
    where: { institutionId },
    orderBy: { startsAt: "asc" },
    include: {
      tickets: { where: { status: { not: TicketStatus.CANCELLED } } },
    },
  });

  return events.map((event) => {
    const soldTickets = event.tickets;
    const adultSold = soldTickets.filter((t) => t.category === "ADULTO").length;
    const childSold = soldTickets.filter((t) => t.category === "CRIANCA").length;
    const sold = adultSold + childSold;
    const revenue =
      adultSold * Number(event.adultPrice) + childSold * Number(event.childPrice);

    return {
      ...event,
      sold,
      revenue,
      remaining: event.capacity - sold,
    };
  });
}

export async function getEventById(eventId: string, institutionId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, institutionId },
  });
}

// Sem escopo por institutionId: usada para gerar o PDF de ingressos que a
// Twilio busca diretamente pela URL (sem sessão de usuário). O contributionId
// (cuid) já funciona como identificador não adivinhável.
export async function getSaleForPdf(contributionId: string) {
  const contribution = await prisma.contribution.findFirst({
    where: { id: contributionId },
    include: {
      tickets: {
        where: { status: { not: TicketStatus.CANCELLED } },
        include: { event: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!contribution || contribution.tickets.length === 0) {
    return null;
  }

  return contribution;
}

export async function getSaleForPrinting(
  contributionId: string,
  institutionId: string,
) {
  const contribution = await prisma.contribution.findFirst({
    where: { id: contributionId, institutionId },
    include: {
      tickets: {
        where: { status: { not: TicketStatus.CANCELLED } },
        include: { event: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!contribution || contribution.tickets.length === 0) {
    return null;
  }

  return contribution;
}
