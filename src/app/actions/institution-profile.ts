"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireParoquiaContext } from "@/lib/selected-institution";

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
