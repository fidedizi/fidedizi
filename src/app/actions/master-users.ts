"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireScope } from "@/lib/dal";
import { PermissionModule, UserScope } from "@/generated/prisma/client";
import { sendEmail } from "@/lib/email-sender";
import {
  buildInviteLink,
  generateInviteToken,
  generateUnusablePasswordHash,
} from "@/lib/invite-token";
import {
  CreateMasterUserFormSchema,
  type CreateMasterUserFormState,
} from "@/lib/definitions";

export async function createMasterUser(
  _state: CreateMasterUserFormState,
  formData: FormData,
) {
  await requireScope(UserScope.MASTER);

  const validatedFields = CreateMasterUserFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    scope: formData.get("scope"),
    institutionId: formData.get("institutionId") || undefined,
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, email, scope, institutionId } = validatedFields.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Já existe um usuário cadastrado com esse e-mail." };
  }

  let institution = null;
  if (scope !== "MASTER") {
    institution = await prisma.institution.findUnique({
      where: { id: institutionId },
    });
    if (!institution) {
      return { error: "Instituição não encontrada." };
    }
  }

  const isOwner = scope === "PAROQUIA" && formData.get("isOwner") === "on";
  const modules =
    scope === "PAROQUIA" && !isOwner
      ? (formData.getAll("modules").map(String) as PermissionModule[])
      : [];

  const passwordHash = await generateUnusablePasswordHash();
  const { token, expiresAt } = generateInviteToken();

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      scope: scope as UserScope,
      isOwner,
      passwordSetupToken: token,
      passwordSetupTokenExpiresAt: expiresAt,
      institutionId: institution?.id,
      permissions: {
        create: modules.map((module) => ({
          module,
          canView: true,
          canEdit: true,
        })),
      },
    },
  });

  await sendEmail(
    email,
    "Bem-vindo(a) ao FideDizi",
    `Olá ${name}, seu cadastro${institution ? ` em ${institution.name}` : ""} foi realizado com sucesso.\n\nPara acessar o sistema, clique no link abaixo e cadastre sua senha:\n${buildInviteLink(token)}\n\nEste link é válido por 7 dias.`,
  );

  revalidatePath("/master/usuarios");

  return { message: "Usuário cadastrado com sucesso." };
}

export async function resendMasterUserInvite(
  userId: string,
  _state: { message?: string } | undefined,
  _formData: FormData,
) {
  await requireScope(UserScope.MASTER);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.passwordSetupToken) return;

  const { token, expiresAt } = generateInviteToken();

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordSetupToken: token, passwordSetupTokenExpiresAt: expiresAt },
  });

  await sendEmail(
    user.email,
    "Bem-vindo(a) ao FideDizi",
    `Olá ${user.name}, aqui está novamente o link para acessar o sistema e cadastrar sua senha:\n${buildInviteLink(token)}\n\nEste link é válido por 7 dias.`,
  );

  revalidatePath("/master/usuarios");

  return { message: "Convite reenviado por e-mail." };
}

export async function revokeMasterUser(userId: string) {
  const currentUser = await requireScope(UserScope.MASTER);

  if (userId === currentUser.id) return;

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/master/usuarios");
}
