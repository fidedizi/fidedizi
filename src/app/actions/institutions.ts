"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireScope } from "@/lib/dal";
import { UserScope, InstitutionStatus } from "@/generated/prisma/client";
import {
  InstitutionFormSchema,
  type InstitutionFormState,
} from "@/lib/definitions";

export async function createInstitution(
  _state: InstitutionFormState,
  formData: FormData,
) {
  await requireScope(UserScope.MASTER);

  const parentIdRaw = formData.get("parentId");
  const validatedFields = InstitutionFormSchema.safeParse({
    type: formData.get("type"),
    name: formData.get("name"),
    cnpj: formData.get("cnpj"),
    parentId: parentIdRaw ? String(parentIdRaw) : undefined,
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { type, name, cnpj, parentId } = validatedFields.data;

  const existing = await prisma.institution.findUnique({ where: { cnpj } });
  if (existing) {
    return { error: "Já existe uma instituição cadastrada com esse CNPJ." };
  }

  await prisma.institution.create({
    data: {
      type,
      name,
      cnpj,
      parentId: parentId || null,
      status: InstitutionStatus.PENDING_ONBOARDING,
    },
  });

  revalidatePath("/master/licenciamento");

  return { message: "Instituição cadastrada com sucesso." };
}

async function isDescendantOf(candidateParentId: string, institutionId: string) {
  let currentId: string | null = candidateParentId;
  while (currentId) {
    if (currentId === institutionId) return true;
    const parent: { parentId: string | null } | null =
      await prisma.institution.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });
    currentId = parent?.parentId ?? null;
  }
  return false;
}

export async function updateInstitution(
  institutionId: string,
  _state: InstitutionFormState,
  formData: FormData,
) {
  await requireScope(UserScope.MASTER);

  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
  });
  if (!institution) {
    return { error: "Instituição não encontrada." };
  }

  const parentIdRaw = formData.get("parentId");
  const validatedFields = InstitutionFormSchema.safeParse({
    type: formData.get("type"),
    name: formData.get("name"),
    cnpj: formData.get("cnpj"),
    parentId: parentIdRaw ? String(parentIdRaw) : undefined,
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { type, name, cnpj, parentId } = validatedFields.data;

  const existing = await prisma.institution.findFirst({
    where: { cnpj, id: { not: institutionId } },
  });
  if (existing) {
    return { error: "Já existe uma instituição cadastrada com esse CNPJ." };
  }

  if (parentId && (await isDescendantOf(parentId, institutionId))) {
    return {
      error:
        "Não é possível definir essa instituição como superior — criaria um ciclo na hierarquia.",
    };
  }

  await prisma.institution.update({
    where: { id: institutionId },
    data: {
      type,
      name,
      cnpj,
      parentId: parentId || null,
    },
  });

  revalidatePath("/master/licenciamento");

  return { message: "Instituição atualizada com sucesso." };
}

export async function setInstitutionStatus(
  institutionId: string,
  status: InstitutionStatus,
) {
  await requireScope(UserScope.MASTER);

  await prisma.institution.update({
    where: { id: institutionId },
    data: { status },
  });

  revalidatePath("/master/licenciamento");
}
