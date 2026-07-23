"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { panelPathForScope } from "@/lib/panels";
import {
  ActivateAccountFormSchema,
  type ActivateAccountFormState,
} from "@/lib/definitions";

export async function activateAccount(
  token: string,
  _state: ActivateAccountFormState,
  formData: FormData,
) {
  const validatedFields = ActivateAccountFormSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const user = await prisma.user.findUnique({
    where: { passwordSetupToken: token },
  });

  if (
    !user ||
    !user.passwordSetupTokenExpiresAt ||
    user.passwordSetupTokenExpiresAt < new Date()
  ) {
    return { error: "Este link de ativação é inválido ou expirou." };
  }

  const { password } = validatedFields.data;
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
      passwordSetupToken: null,
      passwordSetupTokenExpiresAt: null,
    },
  });

  await createSession({
    userId: user.id,
    scope: user.scope,
    institutionId: user.institutionId,
  });

  redirect(panelPathForScope(user.scope));
}
