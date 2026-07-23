"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireParoquiaContext } from "@/lib/selected-institution";
import {
  MemberFormSchema,
  type MemberFormState,
  FlagFormSchema,
  type FlagFormState,
} from "@/lib/definitions";
import { addCountryCode, stripCountryCode } from "@/lib/whatsapp";
import {
  ContributionStatus,
  ContributionType,
  MessageTrigger,
} from "@/generated/prisma/client";
import { sendWhatsAppMessage } from "@/lib/whatsapp-sender";
import {
  buildTitheReminderMessage,
  CONTRIBUTION_TYPE_LABELS,
  withInstitutionHeader,
} from "@/lib/receipt";
import { OVERDUE_FLAG_NAME, OVERDUE_WINDOW_DAYS } from "@/lib/overdue";

export async function createMember(
  _state: MemberFormState,
  formData: FormData,
) {
  const { institution } = await requireParoquiaContext();

  const validatedFields = MemberFormSchema.safeParse({
    name: formData.get("name"),
    whatsapp: formData.get("whatsapp"),
    birthDate: formData.get("birthDate"),
    email: formData.get("email"),
    address: formData.get("address"),
    donationMethod: formData.get("donationMethod"),
    isActiveTither: formData.get("isActiveTither"),
    notes: formData.get("notes"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const {
    name,
    whatsapp,
    birthDate,
    email,
    address,
    donationMethod,
    isActiveTither,
    notes,
  } = validatedFields.data;
  const flagIds = formData.getAll("flagIds").map(String);
  const fullWhatsapp = addCountryCode(whatsapp);

  const existingMembers = await prisma.member.findMany({
    where: { institutionId: institution.id },
    select: { id: true, name: true, whatsapp: true },
  });

  const duplicate = existingMembers.find(
    (m) => stripCountryCode(m.whatsapp) === whatsapp,
  );

  if (duplicate) {
    return {
      error: `Esse WhatsApp já está cadastrado para "${duplicate.name}".`,
    };
  }

  await prisma.member.create({
    data: {
      institutionId: institution.id,
      name,
      whatsapp: fullWhatsapp,
      birthDate: birthDate ? new Date(birthDate) : null,
      email: email || null,
      address: address || null,
      donationMethod,
      isActiveTither: isActiveTither ?? false,
      notes: notes || null,
      flags: { create: flagIds.map((flagId) => ({ flagId })) },
    },
  });

  revalidatePath("/paroquia/membros");

  return { message: "Fiel cadastrado com sucesso." };
}

export async function updateMember(
  memberId: string,
  _state: MemberFormState,
  formData: FormData,
) {
  const { institution } = await requireParoquiaContext();

  const member = await prisma.member.findFirst({
    where: { id: memberId, institutionId: institution.id },
  });

  if (!member) {
    return { error: "Fiel não encontrado." };
  }

  const validatedFields = MemberFormSchema.safeParse({
    name: formData.get("name"),
    whatsapp: formData.get("whatsapp"),
    birthDate: formData.get("birthDate"),
    email: formData.get("email"),
    address: formData.get("address"),
    donationMethod: formData.get("donationMethod"),
    isActiveTither: formData.get("isActiveTither"),
    notes: formData.get("notes"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const {
    name,
    whatsapp,
    birthDate,
    email,
    address,
    donationMethod,
    isActiveTither,
    notes,
  } = validatedFields.data;
  const flagIds = formData.getAll("flagIds").map(String);
  const fullWhatsapp = addCountryCode(whatsapp);

  if (fullWhatsapp !== member.whatsapp) {
    const existingMembers = await prisma.member.findMany({
      where: { institutionId: institution.id, id: { not: memberId } },
      select: { id: true, name: true, whatsapp: true },
    });

    const duplicate = existingMembers.find(
      (m) => stripCountryCode(m.whatsapp) === whatsapp,
    );

    if (duplicate) {
      return {
        error: `Esse WhatsApp já está cadastrado para "${duplicate.name}".`,
      };
    }
  }

  await prisma.member.update({
    where: { id: memberId },
    data: {
      name,
      whatsapp: fullWhatsapp,
      birthDate: birthDate ? new Date(birthDate) : null,
      email: email || null,
      address: address || null,
      donationMethod,
      isActiveTither: isActiveTither ?? false,
      notes: notes || null,
      flags: {
        deleteMany: {},
        create: flagIds.map((flagId) => ({ flagId })),
      },
    },
  });

  revalidatePath("/paroquia/membros");
  revalidatePath(`/paroquia/membros/${memberId}`);

  return { message: "Fiel atualizado com sucesso." };
}

export async function getMemberRelationships(memberId: string) {
  const { institution } = await requireParoquiaContext();

  const member = await prisma.member.findFirst({
    where: { id: memberId, institutionId: institution.id },
    select: { id: true },
  });
  if (!member) return [];

  const contributions = await prisma.contribution.findMany({
    where: { memberId, status: ContributionStatus.CONFIRMED },
    include: { campaign: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });

  return contributions.map((c) => ({
    id: c.id,
    label: c.campaign?.title ?? CONTRIBUTION_TYPE_LABELS[c.type],
    createdAt: c.createdAt.toISOString(),
    value: Number(c.grossAmount),
  }));
}

export async function deleteMember(memberId: string) {
  const { institution } = await requireParoquiaContext();

  const member = await prisma.member.findFirst({
    where: { id: memberId, institutionId: institution.id },
  });

  if (!member) {
    return;
  }

  await prisma.member.delete({ where: { id: memberId } });

  revalidatePath("/paroquia/membros");
  revalidatePath("/paroquia/financeiro");
}

export async function createFlag(_state: FlagFormState, formData: FormData) {
  const { institution } = await requireParoquiaContext();

  const validatedFields = FlagFormSchema.safeParse({
    name: formData.get("name"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name } = validatedFields.data;

  const existing = await prisma.flag.findUnique({
    where: { institutionId_name: { institutionId: institution.id, name } },
  });

  if (existing) {
    return { error: "Essa pastoral/movimento já existe." };
  }

  await prisma.flag.create({
    data: { institutionId: institution.id, name },
  });

  revalidatePath("/paroquia/configuracoes");
  revalidatePath("/paroquia/membros");

  return { message: "Pastoral/movimento cadastrada com sucesso." };
}

export type MemberBulkActionState = { message?: string } | undefined;

export async function identifyOverdueTithers(
  _state?: MemberBulkActionState,
  _formData?: FormData,
) {
  const { institution } = await requireParoquiaContext();

  const overdueFlag = await prisma.flag.upsert({
    where: {
      institutionId_name: {
        institutionId: institution.id,
        name: OVERDUE_FLAG_NAME,
      },
    },
    update: {},
    create: { institutionId: institution.id, name: OVERDUE_FLAG_NAME },
  });

  const tithers = await prisma.member.findMany({
    where: { institutionId: institution.id, isActiveTither: true },
    include: { flags: { where: { flagId: overdueFlag.id } } },
  });

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - OVERDUE_WINDOW_DAYS);

  let flaggedCount = 0;

  for (const tither of tithers) {
    const recentTithe = await prisma.contribution.findFirst({
      where: {
        memberId: tither.id,
        type: ContributionType.DIZIMO,
        status: ContributionStatus.CONFIRMED,
        createdAt: { gte: cutoff },
      },
    });

    const isCurrentlyFlagged = tither.flags.length > 0;

    if (!recentTithe && !isCurrentlyFlagged) {
      await prisma.memberFlag.create({
        data: { memberId: tither.id, flagId: overdueFlag.id },
      });
      flaggedCount++;
    } else if (recentTithe && isCurrentlyFlagged) {
      await prisma.memberFlag.delete({
        where: { memberId_flagId: { memberId: tither.id, flagId: overdueFlag.id } },
      });
    }
  }

  revalidatePath("/paroquia/membros");

  return {
    message:
      flaggedCount > 0
        ? `${flaggedCount} fiel(is) identificado(s) como em atraso.`
        : "Nenhum novo fiel em atraso identificado.",
  };
}

export async function remindOverdueTithers(
  _state?: MemberBulkActionState,
  _formData?: FormData,
) {
  const { institution } = await requireParoquiaContext();

  const overdueFlag = await prisma.flag.findUnique({
    where: {
      institutionId_name: {
        institutionId: institution.id,
        name: OVERDUE_FLAG_NAME,
      },
    },
  });

  if (!overdueFlag) {
    return { message: "Nenhum fiel em atraso. Use 'Identificar Atrasos' primeiro." };
  }

  const overdueMembers = await prisma.member.findMany({
    where: { institutionId: institution.id, flags: { some: { flagId: overdueFlag.id } } },
  });

  if (overdueMembers.length === 0) {
    return { message: "Nenhum fiel em atraso no momento." };
  }

  const template = await prisma.messageTemplate.findUnique({
    where: {
      institutionId_trigger: {
        institutionId: institution.id,
        trigger: MessageTrigger.TITHE_REMINDER,
      },
    },
  });

  for (const member of overdueMembers) {
    const reminderMessage = withInstitutionHeader(
      institution.name,
      buildTitheReminderMessage(template?.body, {
        nome: member.name,
      }),
    );

    await sendWhatsAppMessage(member.whatsapp, reminderMessage);

    await prisma.memberMessage.create({
      data: {
        memberId: member.id,
        trigger: MessageTrigger.TITHE_REMINDER,
        sentAt: new Date(),
      },
    });

    revalidatePath(`/paroquia/membros/${member.id}`);
  }

  return {
    message: `Lembrete enviado para ${overdueMembers.length} fiel(is) em atraso.`,
  };
}
