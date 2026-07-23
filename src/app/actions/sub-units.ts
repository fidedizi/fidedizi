"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireScope } from "@/lib/dal";
import { UserScope } from "@/generated/prisma/client";
import {
  SubUnitFormSchema,
  type SubUnitFormState,
} from "@/lib/definitions";

function parseSubUnitFields(formData: FormData) {
  return SubUnitFormSchema.safeParse({
    name: formData.get("name"),
    cnpj: formData.get("cnpj"),
    type: formData.get("type"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
    contactName: formData.get("contactName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    status: formData.get("status"),
  });
}

export async function createSubUnit(
  _state: SubUnitFormState,
  formData: FormData,
) {
  const user = await requireScope(UserScope.PAROQUIA);

  const validatedFields = parseSubUnitFields(formData);
  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, cnpj, type, address, city, state, contactName, phone, email } =
    validatedFields.data;

  const existing = await prisma.institution.findUnique({ where: { cnpj } });
  if (existing) {
    return { error: "Já existe uma instituição cadastrada com esse CNPJ." };
  }

  await prisma.institution.create({
    data: {
      type,
      name,
      cnpj,
      parentId: user.institutionId!,
      address: address || null,
      city: city || null,
      state: state || null,
      contactName: contactName || null,
      phone: phone || null,
      email: email || null,
      status: "ACTIVE",
    },
  });

  revalidatePath("/paroquia/configuracoes/capelas");

  return { message: "Comunidade cadastrada com sucesso." };
}

export async function updateSubUnit(
  subUnitId: string,
  _state: SubUnitFormState,
  formData: FormData,
) {
  const user = await requireScope(UserScope.PAROQUIA);

  const subUnit = await prisma.institution.findFirst({
    where: { id: subUnitId, parentId: user.institutionId! },
  });

  if (!subUnit) {
    return { error: "Comunidade não encontrada." };
  }

  const validatedFields = parseSubUnitFields(formData);
  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const {
    name,
    cnpj,
    type,
    address,
    city,
    state,
    contactName,
    phone,
    email,
    status,
  } = validatedFields.data;

  if (cnpj !== subUnit.cnpj) {
    const existing = await prisma.institution.findUnique({ where: { cnpj } });
    if (existing) {
      return {
        error: "Já existe uma instituição cadastrada com esse CNPJ.",
      };
    }
  }

  await prisma.institution.update({
    where: { id: subUnitId },
    data: {
      name,
      cnpj,
      type,
      address: address || null,
      city: city || null,
      state: state || null,
      contactName: contactName || null,
      phone: phone || null,
      email: email || null,
      status,
    },
  });

  revalidatePath("/paroquia/configuracoes/capelas");

  return { message: "Comunidade atualizada com sucesso." };
}
