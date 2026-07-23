"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireParoquiaContext } from "@/lib/selected-institution";
import {
  MassScheduleFormSchema,
  type MassScheduleFormState,
} from "@/lib/definitions";

export async function createMassSchedule(
  _state: MassScheduleFormState,
  formData: FormData,
) {
  const { institution } = await requireParoquiaContext();

  const validatedFields = MassScheduleFormSchema.safeParse({
    dayOfWeek: formData.get("dayOfWeek"),
    time: formData.get("time"),
    description: formData.get("description"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { dayOfWeek, time, description } = validatedFields.data;

  await prisma.massSchedule.create({
    data: {
      institutionId: institution.id,
      dayOfWeek,
      time,
      description: description || null,
    },
  });

  revalidatePath("/paroquia/horarios-missas");

  return { message: "Horário de missa cadastrado com sucesso." };
}

export async function deleteMassSchedule(massScheduleId: string) {
  const { institution } = await requireParoquiaContext();

  const massSchedule = await prisma.massSchedule.findFirst({
    where: { id: massScheduleId, institutionId: institution.id },
  });
  if (!massSchedule) return;

  await prisma.massSchedule.delete({ where: { id: massScheduleId } });

  revalidatePath("/paroquia/horarios-missas");
}
