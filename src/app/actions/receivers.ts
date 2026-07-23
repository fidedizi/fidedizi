"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireScope } from "@/lib/dal";
import { UserScope, ReceiverStatus } from "@/generated/prisma/client";
import { ReceiverFormSchema, type ReceiverFormState } from "@/lib/definitions";

export async function upsertReceiver(
  _state: ReceiverFormState,
  formData: FormData,
) {
  await requireScope(UserScope.MASTER);

  const validatedFields = ReceiverFormSchema.safeParse({
    institutionId: formData.get("institutionId"),
    gatewayProvider: formData.get("gatewayProvider"),
    externalId: formData.get("externalId"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { institutionId, gatewayProvider, externalId } = validatedFields.data;

  // Sem integração real com o gateway (Pagar.me/Asaas) ainda, o recebedor
  // fica registrado como pendente até a aprovação ser confirmada por lá.
  await prisma.receiver.upsert({
    where: { institutionId },
    update: { gatewayProvider, externalId, status: ReceiverStatus.PENDING },
    create: {
      institutionId,
      gatewayProvider,
      externalId,
      status: ReceiverStatus.PENDING,
    },
  });

  revalidatePath("/master/recebedores");

  return {
    message: "Recebedor registrado. Aguardando aprovação do gateway.",
  };
}
