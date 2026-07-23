"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireParoquiaContext } from "@/lib/selected-institution";
import { PermissionModule, UserScope } from "@/generated/prisma/client";
import { sendEmail } from "@/lib/email-sender";
import {
  buildInviteLink,
  generateInviteToken,
  generateUnusablePasswordHash,
} from "@/lib/invite-token";
import {
  CreateAdminFormSchema,
  type CreateAdminFormState,
} from "@/lib/definitions";

export async function createAdmin(
  _state: CreateAdminFormState,
  formData: FormData,
) {
  const { institution } = await requireParoquiaContext();

  const validatedFields = CreateAdminFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, email } = validatedFields.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Já existe um usuário cadastrado com esse e-mail." };
  }

  const modules = formData.getAll("modules").map(String) as PermissionModule[];
  const passwordHash = await generateUnusablePasswordHash();
  const { token, expiresAt } = generateInviteToken();

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      scope: UserScope.PAROQUIA,
      isOwner: false,
      passwordSetupToken: token,
      passwordSetupTokenExpiresAt: expiresAt,
      institutionId: institution.id,
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
    `Olá ${name}, seu cadastro em ${institution.name} foi realizado com sucesso.\n\nPara acessar o sistema, clique no link abaixo e cadastre sua senha:\n${buildInviteLink(token)}\n\nEste link é válido por 7 dias.`,
  );

  revalidatePath("/paroquia/administradores");

  return { message: "Usuário cadastrado com sucesso." };
}

export async function resendAdminInvite(
  userId: string,
  _state: { message?: string } | undefined,
  _formData: FormData,
) {
  const { institution } = await requireParoquiaContext();

  const admin = await prisma.user.findFirst({
    where: { id: userId, institutionId: institution.id, scope: UserScope.PAROQUIA },
  });
  if (!admin || !admin.passwordSetupToken) return;

  const { token, expiresAt } = generateInviteToken();

  await prisma.user.update({
    where: { id: admin.id },
    data: { passwordSetupToken: token, passwordSetupTokenExpiresAt: expiresAt },
  });

  await sendEmail(
    admin.email,
    "Bem-vindo(a) ao FideDizi",
    `Olá ${admin.name}, aqui está novamente o link para acessar o sistema e cadastrar sua senha:\n${buildInviteLink(token)}\n\nEste link é válido por 7 dias.`,
  );

  revalidatePath("/paroquia/administradores");

  return { message: "Convite reenviado por e-mail." };
}

export async function togglePermission(
  userId: string,
  module: PermissionModule,
) {
  const { institution } = await requireParoquiaContext();

  const admin = await prisma.user.findFirst({
    where: { id: userId, institutionId: institution.id, scope: UserScope.PAROQUIA },
  });
  if (!admin || admin.isOwner) return;

  const existing = await prisma.userPermission.findUnique({
    where: { userId_module: { userId, module } },
  });

  if (existing) {
    const next = !existing.canView;
    await prisma.userPermission.update({
      where: { id: existing.id },
      data: { canView: next, canEdit: next },
    });
  } else {
    await prisma.userPermission.create({
      data: { userId, module, canView: true, canEdit: true },
    });
  }

  revalidatePath("/paroquia/administradores");
}

export async function revokeAdmin(userId: string) {
  const { institution } = await requireParoquiaContext();

  const admin = await prisma.user.findFirst({
    where: { id: userId, institutionId: institution.id, scope: UserScope.PAROQUIA },
  });
  if (!admin || admin.isOwner) return;

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/paroquia/administradores");
}
