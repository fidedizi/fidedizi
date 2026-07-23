"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireParoquiaContext } from "@/lib/selected-institution";
import { addCountryCode } from "@/lib/whatsapp";

export type InstitutionPixKeyState =
  | { message?: string; error?: string }
  | undefined;

export async function updateInstitutionPixKey(
  _state: InstitutionPixKeyState,
  formData: FormData,
) {
  const { institution } = await requireParoquiaContext();

  const pixKey = String(formData.get("pixKey") ?? "").trim();

  await prisma.institution.update({
    where: { id: institution.id },
    data: { pixKey: pixKey || null },
  });

  revalidatePath("/paroquia/configuracoes");

  return { message: "Chave Pix atualizada com sucesso." };
}

export type InstitutionSecretariaWhatsappState =
  | { message?: string; error?: string }
  | undefined;

export async function updateInstitutionSecretariaWhatsapp(
  _state: InstitutionSecretariaWhatsappState,
  formData: FormData,
) {
  const { institution } = await requireParoquiaContext();

  const digits = String(formData.get("phone") ?? "").replace(/\D/g, "");
  // Normaliza com DDI, igual ao número dos fiéis, para que formatWhatsApp
  // consiga exibi-lo formatado no chatbot.
  const phone = digits ? addCountryCode(digits) : "";

  await prisma.institution.update({
    where: { id: institution.id },
    data: { phone: phone || null },
  });

  revalidatePath("/paroquia/configuracoes");

  return { message: "Número da secretaria atualizado com sucesso." };
}
