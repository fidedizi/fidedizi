import "server-only";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import {
  ChatState,
  ContributionMethod,
  ContributionStatus,
  ContributionType,
  MessageTrigger,
} from "@/generated/prisma/client";
import { formatBRL } from "@/lib/format";
import { CONTRIBUTION_TYPE_LABELS } from "@/lib/receipt";
import { WEEKDAY_LABELS } from "@/lib/labels";
import { formatWhatsApp } from "@/lib/whatsapp";

// Dado um número em qualquer formato (com/sem "whatsapp:", "+", pontuação),
// retorna as variantes possíveis com DDI já que o número local de um fiel
// pode estar cadastrado com 8 ou 9 dígitos (ver nota sobre o "nono dígito"
// em whatsapp-sender.ts).
function phoneDigitVariants(rawPhone: string): string[] {
  const digits = rawPhone.replace(/\D/g, "");
  const match = digits.match(/^55(\d{2})(\d{8,9})$/);
  if (!match) return [digits];
  const [, ddd, local] = match;
  if (local.length === 9 && local.startsWith("9")) {
    return [digits, `55${ddd}${local.slice(1)}`];
  }
  if (local.length === 8) {
    return [digits, `55${ddd}9${local}`];
  }
  return [digits];
}

function mainMenuText(name: string) {
  return `Olá, ${name}! Como posso te ajudar hoje?

1️⃣ Horários de missas e eventos
2️⃣ Enviar pedido de oração
3️⃣ Contribuir com dízimo ou oferta
4️⃣ Consultar meu histórico de contribuições
5️⃣ Falar com a equipe pastoral

Responda com o número da opção. Digite *0* a qualquer momento para voltar a este menu.`;
}

type MemberWithInstitution = Awaited<
  ReturnType<typeof findMemberByPhone>
>;

// Se o mesmo número estiver cadastrado em mais de uma instituição (ex.: o
// fiel se mudou e se cadastrou de novo em outra paróquia/capela/comunidade),
// usa sempre o cadastro mais recente.
async function findMemberByPhone(digits: string) {
  return prisma.member.findFirst({
    where: { whatsapp: { in: phoneDigitVariants(digits) } },
    orderBy: { createdAt: "desc" },
    include: { institution: true },
  });
}

async function handleMassSchedulesAndEvents(institutionId: string) {
  const [massSchedules, events] = await Promise.all([
    prisma.massSchedule.findMany({
      where: { institutionId },
      orderBy: [{ dayOfWeek: "asc" }, { time: "asc" }],
    }),
    prisma.event.findMany({
      where: {
        institutionId,
        status: "ATIVO",
        startsAt: { gte: new Date() },
      },
      orderBy: { startsAt: "asc" },
      take: 5,
    }),
  ]);

  const sections: string[] = [];

  if (massSchedules.length > 0) {
    const list = massSchedules
      .map((schedule) => {
        const description = schedule.description
          ? ` — ${schedule.description}`
          : "";
        return `⛪ ${WEEKDAY_LABELS[schedule.dayOfWeek]}, ${schedule.time}${description}`;
      })
      .join("\n");
    sections.push(`Horários de missa:\n\n${list}`);
  }

  if (events.length > 0) {
    const list = events
      .map((event) => {
        const date = event.startsAt.toLocaleDateString("pt-BR");
        const time = event.startsAt.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const location = event.location ? ` (${event.location})` : "";
        return `📅 ${event.title} — ${date} às ${time}h${location}`;
      })
      .join("\n");
    sections.push(`Próximos eventos e celebrações:\n\n${list}`);
  }

  if (sections.length === 0) {
    return "Não há horários de missa ou eventos cadastrados no momento.";
  }

  return sections.join("\n\n");
}

async function handleContributionHistory(memberId: string) {
  const contributions = await prisma.contribution.findMany({
    where: { memberId, status: ContributionStatus.CONFIRMED },
    include: { campaign: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (contributions.length === 0) {
    return "Você ainda não possui contribuições confirmadas registradas.";
  }

  const list = contributions
    .map((c) => {
      const label = c.campaign?.title ?? CONTRIBUTION_TYPE_LABELS[c.type];
      return `• ${label} — ${formatBRL(c.grossAmount)} em ${c.createdAt.toLocaleDateString("pt-BR")}`;
    })
    .join("\n");

  return `Suas últimas contribuições:\n\n${list}`;
}

async function handlePastoralContact(institutionId: string) {
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
  });

  const lines = [
    institution?.phone ? `📞 ${formatWhatsApp(institution.phone)}` : null,
    institution?.email ? `✉️ ${institution.email}` : null,
  ].filter((line): line is string => Boolean(line));

  if (lines.length === 0) {
    return "Ainda não temos um contato direto cadastrado. Fale com a secretaria durante o horário de atendimento.";
  }

  return `Fale com nossa equipe pastoral:\n\n${lines.join("\n")}`;
}

async function handleMainMenuChoice(
  member: NonNullable<MemberWithInstitution>,
  sessionId: string,
  choice: string,
) {
  switch (choice.trim()) {
    case "1":
      return handleMassSchedulesAndEvents(member.institutionId);

    case "2":
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { state: ChatState.AWAITING_PRAYER_REQUEST },
      });
      return "Pode escrever seu pedido de oração. Vamos rezar por essa intenção. 🙏";

    case "3":
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { state: ChatState.AWAITING_CONTRIBUTION_TYPE },
      });
      return "Você quer contribuir com:\n\n1️⃣ Dízimo\n2️⃣ Oferta\n\nResponda com o número.";

    case "4":
      return handleContributionHistory(member.id);

    case "5":
      return handlePastoralContact(member.institutionId);

    default:
      return `Não entendi sua resposta.\n\n${mainMenuText(member.name)}`;
  }
}

async function handlePrayerRequest(
  member: NonNullable<MemberWithInstitution>,
  sessionId: string,
  phone: string,
  body: string,
) {
  await prisma.prayerRequest.create({
    data: {
      institutionId: member.institutionId,
      memberId: member.id,
      phone,
      message: body,
    },
  });

  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { state: ChatState.MAIN_MENU },
  });

  return `Recebemos seu pedido de oração. 🙏 Nossa comunidade vai rezar por essa intenção.\n\n${mainMenuText(member.name)}`;
}

async function handleContributionType(
  member: NonNullable<MemberWithInstitution>,
  sessionId: string,
  body: string,
) {
  const choice = body.trim();
  if (choice !== "1" && choice !== "2") {
    return "Responda com *1* para Dízimo ou *2* para Oferta.";
  }

  const type = choice === "1" ? "DIZIMO" : "OFERTA";

  await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      state: ChatState.AWAITING_CONTRIBUTION_AMOUNT,
      context: JSON.stringify({ type }),
    },
  });

  return "Qual valor você deseja contribuir? Responda só com o número (ex.: 50 ou 50,00).";
}

async function handleContributionAmount(
  member: NonNullable<MemberWithInstitution>,
  sessionId: string,
  contextRaw: string | null,
  body: string,
) {
  const normalized = body
    .trim()
    .replace(/[^\d.,]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const amount = Number(normalized);

  if (!amount || amount <= 0) {
    return "Valor inválido. Responda só com o número (ex.: 50 ou 50,00).";
  }

  const context = contextRaw ? JSON.parse(contextRaw) : {};
  const type: "DIZIMO" | "OFERTA" =
    context.type === "DIZIMO" ? "DIZIMO" : "OFERTA";

  await prisma.contribution.create({
    data: {
      institutionId: member.institutionId,
      memberId: member.id,
      type: type as ContributionType,
      method: ContributionMethod.PIX,
      status: ContributionStatus.PENDING,
      grossAmount: amount,
      feeAmount: 0,
      netAmount: amount,
    },
  });

  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { state: ChatState.MAIN_MENU, context: null },
  });

  const pixLine = member.institution.pixKey
    ? `Chave Pix para pagamento: \`${member.institution.pixKey}\``
    : "Nossa secretaria vai entrar em contato para combinar o pagamento.";

  return `Combinado! Registramos sua contribuição de ${formatBRL(amount)} (${CONTRIBUTION_TYPE_LABELS[type]}).\n\n${pixLine}\n\nAssim que o pagamento for confirmado, você recebe a confirmação por aqui. Obrigado pela generosidade! 💙\n\n${mainMenuText(member.name)}`;
}

export async function handleIncomingWhatsAppMessage(
  fromRaw: string,
  bodyRaw: string,
) {
  const digits = fromRaw.replace(/\D/g, "");
  const body = bodyRaw.trim();

  const member = await findMemberByPhone(digits);

  if (!member) {
    return "Não encontramos seu cadastro em nenhuma paróquia, capela ou comunidade. Entre em contato com a secretaria para se cadastrar.";
  }

  let session = await prisma.chatSession.findUnique({
    where: { phone: digits },
  });
  const isFirstContact = !session;

  if (!session) {
    session = await prisma.chatSession.create({
      data: {
        phone: digits,
        institutionId: member.institutionId,
        memberId: member.id,
        state: ChatState.MAIN_MENU,
      },
    });
  } else if (session.memberId !== member.id) {
    session = await prisma.chatSession.update({
      where: { id: session.id },
      data: { memberId: member.id, institutionId: member.institutionId },
    });
  }

  let welcomePrefix = "";
  if (isFirstContact) {
    const template = await prisma.messageTemplate.findUnique({
      where: {
        institutionId_trigger: {
          institutionId: member.institutionId,
          trigger: MessageTrigger.WELCOME,
        },
      },
    });
    const defaultWelcome = `Seja muito bem-vindo(a), ${member.name}!`;
    welcomePrefix = `${template?.body ?? defaultWelcome}\n\n`;
  }

  if (isFirstContact || body === "0" || body.toLowerCase() === "menu") {
    await prisma.chatSession.update({
      where: { id: session.id },
      data: { state: ChatState.MAIN_MENU, context: null },
    });
    return welcomePrefix + mainMenuText(member.name);
  }

  switch (session.state) {
    case ChatState.AWAITING_PRAYER_REQUEST:
      return (
        welcomePrefix +
        (await handlePrayerRequest(member, session.id, digits, body))
      );
    case ChatState.AWAITING_CONTRIBUTION_TYPE:
      return (
        welcomePrefix + (await handleContributionType(member, session.id, body))
      );
    case ChatState.AWAITING_CONTRIBUTION_AMOUNT:
      return (
        welcomePrefix +
        (await handleContributionAmount(
          member,
          session.id,
          session.context,
          body,
        ))
      );
    case ChatState.MAIN_MENU:
    default:
      return (
        welcomePrefix +
        (await handleMainMenuChoice(member, session.id, body))
      );
  }
}

export function buildTwiml(message: string) {
  const MessagingResponse = twilio.twiml.MessagingResponse;
  const response = new MessagingResponse();
  response.message(message);
  return response.toString();
}
