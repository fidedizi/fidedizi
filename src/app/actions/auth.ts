"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { panelPathForScope } from "@/lib/panels";
import { LoginFormSchema, type LoginFormState } from "@/lib/definitions";

export async function login(_state: LoginFormState, formData: FormData) {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password } = validatedFields.data;

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!user || !passwordMatches) {
    return { message: "E-mail ou senha inválidos." };
  }

  await createSession({
    userId: user.id,
    scope: user.scope,
    institutionId: user.institutionId,
  });

  redirect(panelPathForScope(user.scope));
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
