"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireParoquiaContext } from "@/lib/selected-institution";
import {
  TicketStatus,
  TicketCategory,
  ContributionType,
  ContributionStatus,
  MessageTrigger,
} from "@/generated/prisma/client";
import {
  SellTicketsFormSchema,
  type SellTicketsFormState,
  ValidateTicketFormSchema,
  type ValidateTicketFormState,
} from "@/lib/definitions";
import { calculateSplit } from "@/lib/split";
import { sendWhatsAppMessage } from "@/lib/whatsapp-sender";
import { buildTicketOrderMessage, withInstitutionHeader } from "@/lib/receipt";
import { TICKET_CATEGORY_LABELS } from "@/lib/labels";

export async function sellTickets(
  eventId: string,
  _state: SellTicketsFormState,
  formData: FormData,
) {
  const { institution } = await requireParoquiaContext();

  const event = await prisma.event.findFirst({
    where: { id: eventId, institutionId: institution.id },
    include: {
      _count: {
        select: { tickets: { where: { status: { not: TicketStatus.CANCELLED } } } },
      },
    },
  });

  if (!event) {
    return { message: "Evento não encontrado." };
  }

  const validatedFields = SellTicketsFormSchema.safeParse({
    eventId,
    buyerName: formData.get("buyerName"),
    buyerPhone: formData.get("buyerPhone"),
    buyerEmail: formData.get("buyerEmail"),
    adultCount: formData.get("adultCount"),
    childCount: formData.get("childCount"),
    paymentMethod: formData.get("paymentMethod"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { buyerName, buyerPhone, buyerEmail, adultCount, childCount, paymentMethod } =
    validatedFields.data;

  const memberIdInput = formData.get("memberId");
  let member: { id: string } | null = null;
  if (typeof memberIdInput === "string" && memberIdInput) {
    member = await prisma.member.findFirst({
      where: { id: memberIdInput, institutionId: institution.id },
      select: { id: true },
    });
  }

  const remaining = event.capacity - event._count.tickets;
  const totalRequested = adultCount + childCount;

  if (totalRequested > remaining) {
    return {
      message: `Só restam ${remaining} ingresso(s) disponíveis para este evento.`,
    };
  }

  const totalAmount =
    adultCount * Number(event.adultPrice) + childCount * Number(event.childPrice);

  // Festas/eventos têm comissão FideDizi calculada independentemente do
  // método de pagamento, inclusive vendas em espécie.
  const { feeAmount, netAmount } = await calculateSplit(
    totalAmount,
    institution.id,
  );

  const contribution = await prisma.contribution.create({
    data: {
      institutionId: institution.id,
      memberId: member?.id,
      type: ContributionType.EVENTO,
      method: paymentMethod,
      status: ContributionStatus.CONFIRMED,
      grossAmount: totalAmount,
      feeAmount,
      netAmount,
      buyerName,
      buyerPhone: buyerPhone || null,
      buyerEmail: buyerEmail || null,
    },
  });

  const ticketsData = [
    ...Array.from({ length: adultCount }, () => TicketCategory.ADULTO),
    ...Array.from({ length: childCount }, () => TicketCategory.CRIANCA),
  ];

  await prisma.$transaction(
    ticketsData.map((category) =>
      prisma.ticket.create({
        data: {
          eventId,
          contributionId: contribution.id,
          category,
          qrCode: randomUUID(),
        },
      }),
    ),
  );

  if (buyerPhone) {
    const template = await prisma.messageTemplate.findUnique({
      where: {
        institutionId_trigger: {
          institutionId: institution.id,
          trigger: MessageTrigger.EVENTO,
        },
      },
    });

    const itemSummary = [
      adultCount > 0 ? `${adultCount}x ${TICKET_CATEGORY_LABELS.ADULTO}` : null,
      childCount > 0 ? `${childCount}x ${TICKET_CATEGORY_LABELS.CRIANCA}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    const message = buildTicketOrderMessage(template?.body, {
      nome: buyerName,
      evento: event.title,
      itens: itemSummary,
      valor: totalAmount.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
    });

    const appUrl = process.env.APP_URL ?? "http://localhost:3001";
    const pdfUrl = `${appUrl}/api/eventos/ingressos/${contribution.id}/pdf`;

    await sendWhatsAppMessage(
      buyerPhone,
      withInstitutionHeader(institution.name, message),
      pdfUrl,
    );
  }

  revalidatePath("/paroquia/eventos");
  revalidatePath("/paroquia/financeiro");
  revalidatePath("/paroquia");
  if (member) {
    revalidatePath(`/paroquia/membros/${member.id}`);
  }

  return {
    message: buyerPhone
      ? "Venda registrada e confirmação enviada pelo WhatsApp."
      : `Venda registrada com sucesso: ${totalRequested} ingresso(s).`,
    success: true,
    contributionId: contribution.id,
  };
}

export async function validateTicket(
  _state: ValidateTicketFormState,
  formData: FormData,
) {
  const { user, institution } = await requireParoquiaContext();

  const validatedFields = ValidateTicketFormSchema.safeParse({
    qrCode: formData.get("qrCode"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { qrCode } = validatedFields.data;

  const ticket = await prisma.ticket.findUnique({
    where: { qrCode },
    include: { event: true },
  });

  if (!ticket || ticket.event.institutionId !== institution.id) {
    return { message: "Ingresso não encontrado.", success: false };
  }

  if (ticket.status === TicketStatus.USED) {
    return {
      message: `Ingresso já utilizado em ${ticket.usedAt?.toLocaleString("pt-BR")}.`,
      success: false,
    };
  }

  if (ticket.status === TicketStatus.CANCELLED) {
    return { message: "Ingresso cancelado.", success: false };
  }

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: TicketStatus.USED,
      usedAt: new Date(),
      usedByUserId: user.id,
    },
  });

  const categoryLabel = ticket.category === TicketCategory.ADULTO ? "Adulto" : "Criança";

  return {
    message: `Ingresso válido: ${categoryLabel} — ${ticket.event.title}.`,
    success: true,
  };
}
