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

export type BotReply = {
  text?: string;
  content?: { contentSid: string; variables?: Record<string, string> };
};

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
3️⃣ Contribuir com Dízimo
4️⃣ Contribuir com Oferta
5️⃣ Consultar meu histórico de contribuições
6️⃣ Falar com a equipe pastoral

Responda com o número da opção. Digite *0* a qualquer momento para voltar a este menu.`;
}

// Monta a resposta do menu principal. Quando o Content Template (list-picker)
// está configurado, envia o menu de verdade como botões interativos; sem
// ele, cai de volta no texto simples numerado.
function menuReply(text: string | undefined, memberName: string): BotReply {
  const menuContentSid = process.env.TWILIO_MENU_CONTENT_SID;
  if (!menuContentSid) {
    return {
      text: [text, mainMenuText(memberName)].filter(Boolean).join("\n\n"),
    };
  }
  return {
    text,
    content: { contentSid: menuContentSid, variables: { "1": memberName } },
  };
}

type MemberWithInstitution = Awaited<ReturnType<typeof findMemberByPhone>>;

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

function parseBirthDate(text: string): Date | null {
  const match = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  if (!isRealDate || date > new Date()) return null;

  return date;
}

async function searchInstitutionsByName(query: string) {
  return prisma.institution.findMany({
    where: {
      type: { in: ["PAROQUIA", "CAPELA", "COMUNIDADE"] },
      name: { contains: query, mode: "insensitive" },
    },
    orderBy: { name: "asc" },
    take: 8,
  });
}

async function finishRegistration(
  sessionId: string,
  digits: string,
  context: { name?: string; birthDate?: string },
  institution: { id: string; name: string },
): Promise<BotReply> {
  const name = context.name ?? "";
  const birthDate = context.birthDate ? new Date(context.birthDate) : null;

  const member = await prisma.member.create({
    data: {
      institutionId: institution.id,
      name,
      whatsapp: digits,
      birthDate,
    },
  });

  await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      memberId: member.id,
      institutionId: institution.id,
      state: ChatState.MAIN_MENU,
      context: null,
    },
  });

  const template = await prisma.messageTemplate.findUnique({
    where: {
      institutionId_trigger: {
        institutionId: institution.id,
        trigger: MessageTrigger.WELCOME,
      },
    },
  });
  const defaultWelcome = `Seja muito bem-vindo(a), ${member.name}!`;

  return menuReply(
    `Cadastro realizado com sucesso! 🎉\n\n${template?.body ?? defaultWelcome}`,
    member.name,
  );
}

// Número desconhecido: em vez de só recusar, conduz um cadastro rápido
// (nome, data de nascimento, paróquia/capela/comunidade) e já cria o fiel.
async function handleUnregisteredContact(
  digits: string,
  body: string,
): Promise<BotReply> {
  const session = await prisma.chatSession.findUnique({
    where: { phone: digits },
  });

  if (!session) {
    await prisma.chatSession.create({
      data: { phone: digits, state: ChatState.AWAITING_REGISTRATION_NAME },
    });
    return {
      text: "Não encontramos seu cadastro. Vamos criar um agora! 😊\n\nQual é o seu nome completo?",
    };
  }

  const context: {
    name?: string;
    birthDate?: string;
    institutionCandidates?: { id: string; name: string }[];
  } = session.context ? JSON.parse(session.context) : {};

  switch (session.state) {
    case ChatState.AWAITING_REGISTRATION_NAME: {
      const name = body.trim();
      if (name.length < 3) {
        return { text: "Por favor, informe seu nome completo." };
      }
      await prisma.chatSession.update({
        where: { id: session.id },
        data: {
          state: ChatState.AWAITING_REGISTRATION_BIRTHDATE,
          context: JSON.stringify({ ...context, name }),
        },
      });
      return { text: "Qual é a sua data de nascimento? (formato DD/MM/AAAA)" };
    }

    case ChatState.AWAITING_REGISTRATION_BIRTHDATE: {
      const birthDate = parseBirthDate(body);
      if (!birthDate) {
        return {
          text: "Data inválida. Informe no formato DD/MM/AAAA (ex.: 15/03/1990).",
        };
      }
      await prisma.chatSession.update({
        where: { id: session.id },
        data: {
          state: ChatState.AWAITING_REGISTRATION_INSTITUTION,
          context: JSON.stringify({
            ...context,
            birthDate: birthDate.toISOString(),
          }),
        },
      });
      return {
        text: "De qual paróquia, capela ou comunidade você faz parte? Digite o nome (ou parte dele).",
      };
    }

    case ChatState.AWAITING_REGISTRATION_INSTITUTION: {
      const matches = await searchInstitutionsByName(body.trim());

      if (matches.length === 0) {
        return {
          text: "Não encontramos nenhuma paróquia, capela ou comunidade com esse nome. Tente digitar de outra forma, ou entre em contato com a secretaria.",
        };
      }

      if (matches.length === 1) {
        return finishRegistration(session.id, digits, context, matches[0]);
      }

      const list = matches
        .map((institution, index) => `${index + 1}️⃣ ${institution.name}`)
        .join("\n");

      await prisma.chatSession.update({
        where: { id: session.id },
        data: {
          state: ChatState.AWAITING_REGISTRATION_INSTITUTION_CHOICE,
          context: JSON.stringify({
            ...context,
            institutionCandidates: matches.map((institution) => ({
              id: institution.id,
              name: institution.name,
            })),
          }),
        },
      });
      return {
        text: `Encontramos mais de uma opção. Qual é a certa?\n\n${list}\n\nResponda com o número.`,
      };
    }

    case ChatState.AWAITING_REGISTRATION_INSTITUTION_CHOICE: {
      const candidates = context.institutionCandidates ?? [];
      const chosen = candidates[Number(body.trim()) - 1];
      if (!chosen) {
        return { text: "Responda com o número de uma das opções listadas." };
      }
      return finishRegistration(session.id, digits, context, chosen);
    }

    default: {
      await prisma.chatSession.update({
        where: { id: session.id },
        data: { state: ChatState.AWAITING_REGISTRATION_NAME, context: null },
      });
      return { text: "Vamos recomeçar seu cadastro. Qual é o seu nome completo?" };
    }
  }
}

function joinWithAnd(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
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
    const byDay = new Map<string, typeof massSchedules>();
    for (const schedule of massSchedules) {
      const existing = byDay.get(schedule.dayOfWeek) ?? [];
      existing.push(schedule);
      byDay.set(schedule.dayOfWeek, existing);
    }

    const list = Array.from(byDay.entries())
      .map(([day, daySchedules]) => {
        const times = joinWithAnd(
          daySchedules.map(
            (schedule) =>
              `${schedule.time}h${schedule.description ? ` (${schedule.description})` : ""}`,
          ),
        );
        return `⛪ ${WEEKDAY_LABELS[day]}, ${times}`;
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
): Promise<BotReply> {
  switch (choice.trim()) {
    case "1":
      return { text: await handleMassSchedulesAndEvents(member.institutionId) };

    case "2":
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { state: ChatState.AWAITING_PRAYER_REQUEST },
      });
      return {
        text: "Pode escrever seu pedido de oração. Vamos rezar por essa intenção. 🙏",
      };

    case "3":
    case "4": {
      const type = choice.trim() === "3" ? "DIZIMO" : "OFERTA";
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          state: ChatState.AWAITING_CONTRIBUTION_AMOUNT,
          context: JSON.stringify({ type }),
        },
      });
      return {
        text: `Qual valor você deseja contribuir de ${CONTRIBUTION_TYPE_LABELS[type]}? Responda só com o número (ex.: 50 ou 50,00).`,
      };
    }

    case "5":
      return { text: await handleContributionHistory(member.id) };

    case "6":
      return { text: await handlePastoralContact(member.institutionId) };

    default:
      return menuReply("Não entendi sua resposta.", member.name);
  }
}

async function handlePrayerRequest(
  member: NonNullable<MemberWithInstitution>,
  sessionId: string,
  phone: string,
  body: string,
): Promise<BotReply> {
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

  return menuReply(
    "Recebemos seu pedido de oração. 🙏 Nossa comunidade vai rezar por essa intenção.",
    member.name,
  );
}

async function handleContributionAmount(
  member: NonNullable<MemberWithInstitution>,
  sessionId: string,
  contextRaw: string | null,
  body: string,
): Promise<BotReply> {
  const normalized = body
    .trim()
    .replace(/[^\d.,]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const amount = Number(normalized);

  if (!amount || amount <= 0) {
    return {
      text: "Valor inválido. Responda só com o número (ex.: 50 ou 50,00).",
    };
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

  return menuReply(
    `Combinado! Registramos sua contribuição de ${formatBRL(amount)} (${CONTRIBUTION_TYPE_LABELS[type]}).\n\n${pixLine}\n\nAssim que o pagamento for confirmado, você recebe a confirmação por aqui. Obrigado pela generosidade! 💙`,
    member.name,
  );
}

export async function handleIncomingWhatsAppMessage(
  fromRaw: string,
  bodyRaw: string,
): Promise<BotReply> {
  const digits = fromRaw.replace(/\D/g, "");
  const body = bodyRaw.trim();

  const member = await findMemberByPhone(digits);

  if (!member) {
    return handleUnregisteredContact(digits, body);
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

  if (isFirstContact || body === "0" || body.toLowerCase() === "menu") {
    await prisma.chatSession.update({
      where: { id: session.id },
      data: { state: ChatState.MAIN_MENU, context: null },
    });

    let welcomeText: string | undefined;
    if (isFirstContact) {
      const template = await prisma.messageTemplate.findUnique({
        where: {
          institutionId_trigger: {
            institutionId: member.institutionId,
            trigger: MessageTrigger.WELCOME,
          },
        },
      });
      welcomeText = template?.body ?? `Seja muito bem-vindo(a), ${member.name}!`;
    }

    return menuReply(welcomeText, member.name);
  }

  switch (session.state) {
    case ChatState.AWAITING_PRAYER_REQUEST:
      return handlePrayerRequest(member, session.id, digits, body);
    case ChatState.AWAITING_CONTRIBUTION_AMOUNT:
      return handleContributionAmount(member, session.id, session.context, body);
    case ChatState.MAIN_MENU:
    default:
      return handleMainMenuChoice(member, session.id, body);
  }
}

export function buildTwiml(message?: string) {
  const MessagingResponse = twilio.twiml.MessagingResponse;
  const response = new MessagingResponse();
  if (message) {
    response.message(message);
  }
  return response.toString();
}
