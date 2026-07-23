"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireParoquiaContext } from "@/lib/selected-institution";
import { CampaignType } from "@/generated/prisma/client";
import {
  CampaignEditFormSchema,
  CampaignFormSchema,
  type CampaignFormState,
} from "@/lib/definitions";

function parsePizzaFlavorsFromFormData(formData: FormData) {
  const flavorCountRaw = formData.get("flavorCount");
  const flavorCount = flavorCountRaw ? parseInt(String(flavorCountRaw), 10) : 0;

  const flavors: { name: string; price: number; stockQuantity: number }[] = [];

  for (let i = 0; i < flavorCount; i++) {
    const name = String(formData.get(`flavorName_${i}`) ?? "").trim();
    const priceRaw = formData.get(`flavorPrice_${i}`);
    const stockRaw = formData.get(`flavorStock_${i}`);

    if (!name && !priceRaw && !stockRaw) continue;

    const price = Number(priceRaw);
    const stockQuantity = parseInt(String(stockRaw ?? ""), 10);

    if (
      !name ||
      !(price > 0) ||
      !(Number.isInteger(stockQuantity) && stockQuantity > 0)
    ) {
      return {
        error: `Preencha corretamente o sabor ${i + 1} (nome, valor e quantidade).`,
      };
    }

    flavors.push({ name, price, stockQuantity });
  }

  if (flavors.length === 0) {
    return { error: "Cadastre ao menos um sabor de pizza." };
  }

  const uniqueNames = new Set(flavors.map((f) => f.name.toLowerCase()));
  if (uniqueNames.size !== flavors.length) {
    return { error: "Não repita o mesmo nome de sabor." };
  }

  return { flavors };
}

export async function createCampaign(
  _state: CampaignFormState,
  formData: FormData,
) {
  const { institution } = await requireParoquiaContext();

  const validatedFields = CampaignFormSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    description: formData.get("description"),
    endsAt: formData.get("endsAt"),
    pixKey: formData.get("pixKey"),
    goalAmount: formData.get("goalAmount") || undefined,
    raffleTotalNumbers: formData.get("raffleTotalNumbers") || undefined,
    raffleNumberPrice: formData.get("raffleNumberPrice") || undefined,
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const {
    type,
    title,
    description,
    endsAt,
    pixKey,
    goalAmount,
    raffleTotalNumbers,
    raffleNumberPrice,
  } = validatedFields.data;

  let pizzaFlavors: { name: string; price: number; stockQuantity: number }[] = [];
  if (type === "PIZZA") {
    const parsed = parsePizzaFlavorsFromFormData(formData);
    if (parsed.error) {
      return { error: parsed.error };
    }
    pizzaFlavors = parsed.flavors ?? [];
  }

  await prisma.campaign.create({
    data: {
      institutionId: institution.id,
      type: type as CampaignType,
      title,
      description: description || null,
      endsAt: endsAt ? new Date(endsAt) : null,
      pixKey: pixKey || null,
      goalAmount: type === "PADRAO" ? goalAmount : null,
      raffleTotalNumbers: type === "RIFA" ? raffleTotalNumbers : null,
      raffleNumberPrice: type === "RIFA" ? raffleNumberPrice : null,
      pizzaFlavors:
        pizzaFlavors.length > 0 ? { create: pizzaFlavors } : undefined,
    },
  });

  revalidatePath("/paroquia/campanhas");
  revalidatePath("/paroquia/financeiro");

  return { message: "Campanha criada com sucesso." };
}

export async function updateCampaign(
  campaignId: string,
  _state: CampaignFormState,
  formData: FormData,
) {
  const { institution } = await requireParoquiaContext();

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, institutionId: institution.id },
  });

  if (!campaign) {
    return { error: "Campanha não encontrada." };
  }

  const validatedFields = CampaignEditFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    endsAt: formData.get("endsAt"),
    pixKey: formData.get("pixKey"),
    goalAmount: formData.get("goalAmount") || undefined,
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { title, description, endsAt, pixKey, goalAmount } = validatedFields.data;

  if (campaign.type === "PADRAO" && !(goalAmount && goalAmount > 0)) {
    return { errors: { goalAmount: ["Informe uma meta válida."] } };
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      title,
      description: description || null,
      endsAt: endsAt ? new Date(endsAt) : null,
      pixKey: pixKey || null,
      ...(campaign.type === "PADRAO" ? { goalAmount } : {}),
    },
  });

  revalidatePath("/paroquia/campanhas");
  revalidatePath(`/paroquia/campanhas/${campaignId}`);
  revalidatePath("/paroquia/financeiro");

  return { message: "Campanha atualizada com sucesso." };
}

export async function deleteCampaign(campaignId: string) {
  const { institution } = await requireParoquiaContext();

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, institutionId: institution.id },
  });

  if (!campaign) {
    return;
  }

  await prisma.campaign.delete({ where: { id: campaignId } });

  revalidatePath("/paroquia/campanhas");
  revalidatePath("/paroquia/financeiro");
}
