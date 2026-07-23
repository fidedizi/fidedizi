"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/dal";
import { panelPathForScope } from "@/lib/panels";
import {
  ChangePasswordFormSchema,
  type ChangePasswordFormState,
} from "@/lib/definitions";

export async function changePassword(
  _state: ChangePasswordFormState,
  formData: FormData,
) {
  const user = await getCurrentUser();

  const validatedFields = ChangePasswordFormSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { password } = validatedFields.data;
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  redirect(panelPathForScope(user.scope));
}
