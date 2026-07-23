"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireParoquiaContext } from "@/lib/selected-institution";
import { TicketStatus } from "@/generated/prisma/client";
import { EventFormSchema, type EventFormState } from "@/lib/definitions";

const DEFAULT_DURATION_MS = 60 * 60 * 1000;

function parseEventFields(formData: FormData) {
  const validatedFields = EventFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    date: formData.get("date"),
    time: formData.get("time"),
    location: formData.get("location"),
    adultPrice: formData.get("adultPrice"),
    childPrice: formData.get("childPrice"),
    capacity: formData.get("capacity"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors } as const;
  }

  const { date, time, ...rest } = validatedFields.data;
  const startsAt = new Date(`${date}T${time}`);

  return { data: { ...rest, startsAt } } as const;
}

export async function createEvent(_state: EventFormState, formData: FormData) {
  const { institution } = await requireParoquiaContext();

  const parsed = parseEventFields(formData);
  if ("errors" in parsed) {
    return { errors: parsed.errors };
  }

  const { title, description, location, adultPrice, childPrice, capacity, status, startsAt } =
    parsed.data;

  const effectiveEnd = new Date(startsAt.getTime() + DEFAULT_DURATION_MS);

  const existingEvents = await prisma.event.findMany({
    where: { institutionId: institution.id },
    select: { title: true, startsAt: true },
  });

  const conflict = existingEvents.find((e) => {
    const eEnd = new Date(e.startsAt.getTime() + DEFAULT_DURATION_MS);
    return startsAt < eEnd && e.startsAt < effectiveEnd;
  });

  await prisma.event.create({
    data: {
      institutionId: institution.id,
      title,
      description: description || null,
      startsAt,
      location: location || null,
      adultPrice,
      childPrice,
      capacity,
      status,
    },
  });

  revalidatePath("/paroquia/eventos");

  if (conflict) {
    return {
      message: `Evento criado, mas atenção: conflita de horário com "${conflict.title}".`,
    };
  }

  return { message: "Evento criado com sucesso." };
}

export async function updateEvent(
  eventId: string,
  _state: EventFormState,
  formData: FormData,
) {
  const { institution } = await requireParoquiaContext();

  const event = await prisma.event.findFirst({
    where: { id: eventId, institutionId: institution.id },
  });

  if (!event) {
    return { error: "Evento não encontrado." };
  }

  const parsed = parseEventFields(formData);
  if ("errors" in parsed) {
    return { errors: parsed.errors };
  }

  const { title, description, location, adultPrice, childPrice, capacity, status, startsAt } =
    parsed.data;

  await prisma.event.update({
    where: { id: eventId },
    data: {
      title,
      description: description || null,
      startsAt,
      location: location || null,
      adultPrice,
      childPrice,
      capacity,
      status,
    },
  });

  revalidatePath("/paroquia/eventos");

  return { message: "Evento atualizado com sucesso." };
}

export async function deleteEvent(
  eventId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _state: { error?: string } | undefined,
) {
  const { institution } = await requireParoquiaContext();

  const event = await prisma.event.findFirst({
    where: { id: eventId, institutionId: institution.id },
  });

  if (!event) {
    return { error: "Evento não encontrado." };
  }

  const ticketCount = await prisma.ticket.count({
    where: { eventId, status: { not: TicketStatus.CANCELLED } },
  });

  if (ticketCount > 0) {
    return {
      error: "Não é possível excluir eventos com ingressos vendidos.",
    };
  }

  await prisma.event.delete({ where: { id: eventId } });

  revalidatePath("/paroquia/eventos");

  return undefined;
}
