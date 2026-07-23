"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireParoquiaContext } from "@/lib/selected-institution";
import {
  ContributionMethod,
  ContributionStatus,
  MessageTrigger,
} from "@/generated/prisma/client";
import {
  CashEntryFormSchema,
  type CashEntryFormState,
} from "@/lib/definitions";
import { formatBRL } from "@/lib/format";
import { sendWhatsAppMessage } from "@/lib/whatsapp-sender";
import {
  CONTRIBUTION_TYPE_LABELS,
  buildReceiptMessage,
  withInstitutionHeader,
} from "@/lib/receipt";
import { calculateSplit } from "@/lib/split";

export async function createCashEntry(
  _state: CashEntryFormState,
  formData: FormData,
) {
  const { institution } = await requireParoquiaContext();

  const validatedFields = CashEntryFormSchema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    campaignId: formData.get("campaignId"),
    memberId: formData.get("memberId"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { type, amount, campaignId, memberId } = validatedFields.data;

  let member: { id: string; name: string; whatsapp: string } | null = null;
  if (memberId) {
    member = await prisma.member.findFirst({
      where: { id: memberId, institutionId: institution.id },
      select: { id: true, name: true, whatsapp: true },
    });
    if (!member) {
      return { error: "Fiel não encontrado. Selecione um nome da lista." };
    }
  }

  // Campanhas têm comissão FideDizi calculada mesmo em espécie; dízimo e
  // oferta em espécie não passam pelo gateway, então não há comissão a
  // deduzir.
  const isCommissionable = type === "CAMPANHA";
  const { feeAmount, netAmount } = isCommissionable
    ? await calculateSplit(amount, institution.id)
    : { feeAmount: 0, netAmount: amount };

  await prisma.contribution.create({
    data: {
      institutionId: institution.id,
      campaignId: campaignId || null,
      memberId: memberId || null,
      type,
      method: ContributionMethod.ESPECIE,
      status: ContributionStatus.CONFIRMED,
      grossAmount: amount,
      feeAmount,
      netAmount,
    },
  });

  if (member) {
    const receiptTrigger =
      type === "DIZIMO"
        ? MessageTrigger.TITHE_RECEIPT
        : MessageTrigger.DONATION_RECEIPT;

    const template = await prisma.messageTemplate.findUnique({
      where: {
        institutionId_trigger: {
          institutionId: institution.id,
          trigger: receiptTrigger,
        },
      },
    });

    const receiptMessage = withInstitutionHeader(
      institution.name,
      buildReceiptMessage(template?.body, {
        nome: member.name,
        valor: formatBRL(amount),
        tipo: CONTRIBUTION_TYPE_LABELS[type],
        data: new Date().toLocaleDateString("pt-BR"),
      }),
    );

    await sendWhatsAppMessage(member.whatsapp, receiptMessage);

    await prisma.memberMessage.create({
      data: {
        memberId: member.id,
        trigger: receiptTrigger,
        sentAt: new Date(),
      },
    });

    revalidatePath(`/paroquia/membros/${member.id}`);
  }

  revalidatePath("/paroquia/financeiro");
  revalidatePath("/paroquia/campanhas");
  revalidatePath("/paroquia");

  return { message: "Lançamento registrado com sucesso." };
}

export type ResendReceiptState = { message?: string; error?: string } | undefined;

export async function resendReceipt(
  _state: ResendReceiptState,
  formData: FormData,
) {
  const { institution } = await requireParoquiaContext();
  const contributionId = formData.get("contributionId");

  if (typeof contributionId !== "string" || !contributionId) {
    return { error: "Contribuição inválida." };
  }

  const contribution = await prisma.contribution.findFirst({
    where: { id: contributionId, institutionId: institution.id },
    include: { member: { select: { id: true, name: true, whatsapp: true } } },
  });

  if (!contribution) {
    return { error: "Contribuição não encontrada." };
  }

  const recipientName = contribution.member?.name ?? contribution.buyerName;
  const recipientPhone = contribution.member
    ? contribution.member.whatsapp
    : contribution.buyerPhone;

  if (!recipientName || !recipientPhone) {
    return { error: "Não é possível reenviar: nenhum WhatsApp vinculado a este lançamento." };
  }

  const receiptTrigger =
    contribution.type === "DIZIMO"
      ? MessageTrigger.TITHE_RECEIPT
      : MessageTrigger.DONATION_RECEIPT;

  const template = await prisma.messageTemplate.findUnique({
    where: {
      institutionId_trigger: {
        institutionId: institution.id,
        trigger: receiptTrigger,
      },
    },
  });

  const receiptMessage = withInstitutionHeader(
    institution.name,
    buildReceiptMessage(template?.body, {
      nome: recipientName,
      valor: formatBRL(contribution.grossAmount),
      tipo: CONTRIBUTION_TYPE_LABELS[contribution.type],
      data: contribution.createdAt.toLocaleDateString("pt-BR"),
    }),
  );

  await sendWhatsAppMessage(recipientPhone, receiptMessage);

  if (contribution.member) {
    await prisma.memberMessage.create({
      data: {
        memberId: contribution.member.id,
        trigger: receiptTrigger,
        sentAt: new Date(),
      },
    });

    revalidatePath(`/paroquia/membros/${contribution.member.id}`);
  }

  return { message: "Recibo reenviado com sucesso." };
}
