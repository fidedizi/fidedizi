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
  RaffleConfigFormSchema,
  type RaffleConfigFormState,
  SellRaffleNumbersFormSchema,
  type SellRaffleNumbersFormState,
} from "@/lib/definitions";
import { calculateSplit } from "@/lib/split";
import { sendWhatsAppMessage } from "@/lib/whatsapp-sender";
import { buildRaffleMessage, withInstitutionHeader } from "@/lib/receipt";

export async function configureRaffle(
  campaignId: string,
  _state: RaffleConfigFormState,
  formData: FormData,
) {
  const { institution } = await requireParoquiaContext();

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, institutionId: institution.id },
    include: { _count: { select: { raffleNumbers: true } } },
  });

  if (!campaign) {
    return { error: "Campanha não encontrada." };
  }

  const validatedFields = RaffleConfigFormSchema.safeParse({
    raffleTotalNumbers: formData.get("raffleTotalNumbers"),
    raffleNumberPrice: formData.get("raffleNumberPrice"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { raffleTotalNumbers, raffleNumberPrice } = validatedFields.data;

  if (raffleTotalNumbers < campaign._count.raffleNumbers) {
    return {
      error: `A quantidade não pode ser menor que os ${campaign._count.raffleNumbers} números já vendidos.`,
    };
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { raffleTotalNumbers, raffleNumberPrice },
  });

  revalidatePath("/paroquia/campanhas");

  return { message: "Configuração da rifa salva com sucesso." };
}

export async function sellRaffleNumbers(
  campaignId: string,
  _state: SellRaffleNumbersFormState,
  formData: FormData,
) {
  const { institution } = await requireParoquiaContext();

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, institutionId: institution.id },
    include: { _count: { select: { raffleNumbers: true } } },
  });

  if (!campaign || !campaign.raffleTotalNumbers || !campaign.raffleNumberPrice) {
    return { error: "Configure a rifa desta campanha antes de vender números." };
  }

  const validatedFields = SellRaffleNumbersFormSchema.safeParse({
    buyerName: formData.get("buyerName"),
    buyerPhone: formData.get("buyerPhone"),
    quantity: formData.get("quantity"),
    paymentMethod: formData.get("paymentMethod"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { buyerName, buyerPhone, quantity, paymentMethod } = validatedFields.data;

  const memberIdInput = formData.get("memberId");
  let member: { id: string } | null = null;
  if (typeof memberIdInput === "string" && memberIdInput) {
    member = await prisma.member.findFirst({
      where: { id: memberIdInput, institutionId: institution.id },
      select: { id: true },
    });
  }

  const soldCount = campaign._count.raffleNumbers;
  const remaining = campaign.raffleTotalNumbers - soldCount;

  if (quantity > remaining) {
    return {
      error: `Só restam ${remaining} número(s) disponível(is) para esta rifa.`,
    };
  }

  const numberPrice = Number(campaign.raffleNumberPrice);
  const totalAmount = quantity * numberPrice;

  // Rifas de campanha têm comissão FideDizi calculada independentemente do
  // método de pagamento, como qualquer contribuição do tipo CAMPANHA.
  const { feeAmount, netAmount } = await calculateSplit(
    totalAmount,
    institution.id,
  );

  // Usa o maior número já atribuído (não a contagem) para gerar os próximos,
  // já que a contagem pode ficar defasada do maior número em uso se algum
  // número for cancelado/excluído no meio da faixa.
  const maxNumberAgg = await prisma.raffleNumber.aggregate({
    where: { campaignId },
    _max: { number: true },
  });
  const nextStart = maxNumberAgg._max.number ?? 0;
  const numbers = Array.from({ length: quantity }, (_, i) => nextStart + i + 1);

  // Contribuição e números da rifa precisam nascer juntos: se a atribuição
  // dos números falhar (ex.: número já ocupado), a contribuição não pode
  // ficar órfã sem número nenhum vinculado.
  const contribution = await prisma.$transaction(async (tx) => {
    const contribution = await tx.contribution.create({
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

    for (const number of numbers) {
      await tx.raffleNumber.create({
        data: {
          campaignId,
          number,
          contributionId: contribution.id,
          buyerName,
          buyerPhone,
        },
      });
    }

    return contribution;
  });

  const template = await prisma.messageTemplate.findUnique({
    where: {
      institutionId_trigger: {
        institutionId: institution.id,
        trigger: MessageTrigger.CAMPAIGN,
      },
    },
  });

  let message = buildRaffleMessage(template?.body, {
    nome: buyerName,
    campanha: campaign.title,
    numeros: numbers.join(", "),
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

  revalidatePath("/paroquia/campanhas");
  revalidatePath("/paroquia/financeiro");
  if (member) {
    revalidatePath(`/paroquia/membros/${member.id}`);
  }

  return {
    message: `Venda registrada e confirmação enviada pelo WhatsApp.`,
    success: true,
    numbers,
  };
}
