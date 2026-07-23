"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireParoquiaContext } from "@/lib/selected-institution";
import { MessageScheduleStatus } from "@/generated/prisma/client";
import {
  MessageTemplateFormSchema,
  type MessageTemplateFormState,
  MessageScheduleFormSchema,
  type MessageScheduleFormState,
} from "@/lib/definitions";

export async function upsertMessageTemplate(
  _state: MessageTemplateFormState,
  formData: FormData,
) {
  const { institution } = await requireParoquiaContext();

  const validatedFields = MessageTemplateFormSchema.safeParse({
    trigger: formData.get("trigger"),
    body: formData.get("body"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { trigger, body } = validatedFields.data;

  await prisma.messageTemplate.upsert({
    where: {
      institutionId_trigger: { institutionId: institution.id, trigger },
    },
    update: { body },
    create: { institutionId: institution.id, trigger, body },
  });

  revalidatePath("/paroquia/avisos");

  return { message: "Texto salvo com sucesso." };
}

export async function createMessageSchedule(
  _state: MessageScheduleFormState,
  formData: FormData,
) {
  const { institution } = await requireParoquiaContext();

  const validatedFields = MessageScheduleFormSchema.safeParse({
    trigger: formData.get("trigger"),
    scheduledFor: formData.get("scheduledFor"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { trigger, scheduledFor } = validatedFields.data;

  await prisma.messageSchedule.create({
    data: {
      institutionId: institution.id,
      trigger,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      status: scheduledFor
        ? MessageScheduleStatus.SCHEDULED
        : MessageScheduleStatus.AWAITING_SCHEDULE,
    },
  });

  revalidatePath("/paroquia/avisos");

  return { message: "Agendamento registrado com sucesso." };
}
