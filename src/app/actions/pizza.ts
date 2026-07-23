"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireParoquiaContext } from "@/lib/selected-institution";
import {
  ContributionStatus,
  ContributionType,
  MessageTrigger,
} from "@/generated/prisma/client";
import {
  PizzaFlavorFormSchema,
  type PizzaFlavorFormState,
  SellPizzasFormSchema,
  type SellPizzasFormState,
} from "@/lib/definitions";
import { calculateSplit } from "@/lib/split";
import { sendWhatsAppMessage } from "@/lib/whatsapp-sender";
import { buildPizzaOrderMessage, withInstitutionHeader } from "@/lib/receipt";

export async function createPizzaFlavor(
  campaignId: string,
  _state: PizzaFlavorFormState,
  formData: FormData,
) {
  const { institution } = await requireParoquiaContext();

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, institutionId: institution.id },
  });
  if (!campaign) {
    return { error: "Campanha não encontrada." };
  }

  const validatedFields = PizzaFlavorFormSchema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    stockQuantity: formData.get("stockQuantity"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, price, stockQuantity } = validatedFields.data;

  const existing = await prisma.pizzaFlavor.findUnique({
    where: { campaignId_name: { campaignId, name } },
  });
  if (existing) {
    return { error: "Já existe um sabor com esse nome nesta campanha." };
  }

  await prisma.pizzaFlavor.create({
    data: { campaignId, name, price, stockQuantity },
  });

  revalidatePath("/paroquia/campanhas");

  return { message: "Sabor cadastrado com sucesso." };
}

export async function updatePizzaFlavor(
  flavorId: string,
  _state: PizzaFlavorFormState,
  formData: FormData,
) {
  const { institution } = await requireParoquiaContext();

  const flavor = await prisma.pizzaFlavor.findFirst({
    where: { id: flavorId, campaign: { institutionId: institution.id } },
  });
  if (!flavor) {
    return { error: "Sabor não encontrado." };
  }

  const validatedFields = PizzaFlavorFormSchema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    stockQuantity: formData.get("stockQuantity"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, price, stockQuantity } = validatedFields.data;

  const soldAgg = await prisma.pizzaOrderItem.aggregate({
    where: { flavorId },
    _sum: { quantity: true },
  });
  const sold = soldAgg._sum.quantity ?? 0;

  if (stockQuantity < sold) {
    return {
      error: `A quantidade não pode ser menor que as ${sold} unidade(s) já vendidas.`,
    };
  }

  await prisma.pizzaFlavor.update({
    where: { id: flavorId },
    data: { name, price, stockQuantity },
  });

  revalidatePath("/paroquia/campanhas");

  return { message: "Sabor atualizado com sucesso." };
}

export async function deletePizzaFlavor(flavorId: string) {
  const { institution } = await requireParoquiaContext();

  const flavor = await prisma.pizzaFlavor.findFirst({
    where: { id: flavorId, campaign: { institutionId: institution.id } },
  });
  if (!flavor) return;

  const soldAgg = await prisma.pizzaOrderItem.aggregate({
    where: { flavorId },
    _sum: { quantity: true },
  });
  if ((soldAgg._sum.quantity ?? 0) > 0) return;

  await prisma.pizzaFlavor.delete({ where: { id: flavorId } });

  revalidatePath("/paroquia/campanhas");
}

export async function sellPizzas(
  campaignId: string,
  _state: SellPizzasFormState,
  formData: FormData,
) {
  const { institution } = await requireParoquiaContext();

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, institutionId: institution.id },
    include: { pizzaFlavors: true },
  });

  if (!campaign || campaign.pizzaFlavors.length === 0) {
    return { error: "Cadastre ao menos um sabor antes de vender." };
  }

  const validatedFields = SellPizzasFormSchema.safeParse({
    buyerName: formData.get("buyerName"),
    buyerPhone: formData.get("buyerPhone"),
    paymentMethod: formData.get("paymentMethod"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { buyerName, paymentMethod } = validatedFields.data;
  const buyerPhone = validatedFields.data.buyerPhone || null;

  const memberIdInput = formData.get("memberId");
  let member: { id: string } | null = null;
  if (typeof memberIdInput === "string" && memberIdInput) {
    member = await prisma.member.findFirst({
      where: { id: memberIdInput, institutionId: institution.id },
      select: { id: true },
    });
  }

  const soldByFlavor = await prisma.pizzaOrderItem.groupBy({
    by: ["flavorId"],
    where: { flavorId: { in: campaign.pizzaFlavors.map((f) => f.id) } },
    _sum: { quantity: true },
  });
  const soldMap = new Map(
    soldByFlavor.map((s) => [s.flavorId, s._sum.quantity ?? 0]),
  );

  const items: { flavor: (typeof campaign.pizzaFlavors)[number]; quantity: number }[] =
    [];

  for (const flavor of campaign.pizzaFlavors) {
    const raw = formData.get(`flavor_${flavor.id}`);
    const quantity = raw ? parseInt(String(raw), 10) : 0;
    if (quantity > 0) {
      const sold = soldMap.get(flavor.id) ?? 0;
      const remaining = flavor.stockQuantity - sold;
      if (quantity > remaining) {
        return {
          error: `Só restam ${remaining} unidade(s) de ${flavor.name}.`,
        };
      }
      items.push({ flavor, quantity });
    }
  }

  if (items.length === 0) {
    return { error: "Selecione ao menos uma pizza." };
  }

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * Number(item.flavor.price),
    0,
  );

  // Pizzas vendidas dentro de uma campanha têm comissão FideDizi calculada
  // independentemente do método de pagamento, como qualquer contribuição
  // do tipo CAMPANHA.
  const { feeAmount, netAmount } = await calculateSplit(
    totalAmount,
    institution.id,
  );

  const contribution = await prisma.contribution.create({
    data: {
      institutionId: institution.id,
      campaignId,
      memberId: member?.id,
      type: ContributionType.CAMPANHA,
      method: paymentMethod,
      status: ContributionStatus.CONFIRMED,
      grossAmount: totalAmount,
      feeAmount,
      netAmount,
      buyerName,
      buyerPhone,
    },
  });

  await prisma.$transaction(
    items.map((item) =>
      prisma.pizzaOrderItem.create({
        data: {
          flavorId: item.flavor.id,
          contributionId: contribution.id,
          quantity: item.quantity,
          buyerName,
          buyerPhone,
        },
      }),
    ),
  );

  const summary = items.map((item) => `${item.quantity}x ${item.flavor.name}`);

  if (buyerPhone) {
    const template = await prisma.messageTemplate.findUnique({
      where: {
        institutionId_trigger: {
          institutionId: institution.id,
          trigger: MessageTrigger.CAMPAIGN,
        },
      },
    });

    let message = buildPizzaOrderMessage(template?.body, {
      nome: buyerName,
      campanha: campaign.title,
      itens: summary.join(", "),
      valor: totalAmount.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
    });

    if (paymentMethod === "PIX" && campaign.pixKey) {
      message += `\n\nChave Pix para pagamento: \`${campaign.pixKey}\``;
    }

    await sendWhatsAppMessage(
      buyerPhone,
      withInstitutionHeader(institution.name, message),
    );
  }

  revalidatePath("/paroquia/campanhas");
  revalidatePath("/paroquia/financeiro");
  if (member) {
    revalidatePath(`/paroquia/membros/${member.id}`);
  }

  return {
    message: buyerPhone
      ? "Venda registrada e confirmação enviada pelo WhatsApp."
      : "Venda registrada com sucesso.",
    success: true,
    summary,
  };
}
