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
import { calculateSplit } from "@/lib/split";

export type BotReply = {
  text?: string;
  content?: { contentSid: string; variables?: Record<string, string> };
};

type MenuOption = { id: string; label: string };

const NUMBER_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];

const BASE_MENU_OPTIONS: MenuOption[] = [
  { id: "dizimo", label: "Dízimo" },
  { id: "oferta", label: "Oferta" },
  { id: "missas", label: "Missas e eventos" },
  { id: "oracao", label: "Pedido de oração" },
  { id: "historico", label: "Meu histórico" },
];

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

type PizzaFlavorOption = {
  id: string;
  name: string;
  price: number;
  remaining: number;
};

type EligibleCampaign =
  | { id: string; title: string; type: "PADRAO"; pixKey: string | null }
  | {
      id: string;
      title: string;
      type: "RIFA";
      pixKey: string | null;
      unitPrice: number;
      remaining: number;
    }
  | {
      id: string;
      title: string;
      type: "PIZZA";
      pixKey: string | null;
      flavors: PizzaFlavorOption[];
    };

// Busca as campanhas liberadas para o chatbot desta instituição, já
// filtrando as que não têm o que vender no momento (rifa esgotada, pizza
// sem sabor com estoque, etc.) — essas não aparecem no menu.
async function getEligibleChatbotCampaigns(
  institutionId: string,
): Promise<EligibleCampaign[]> {
  const campaigns = await prisma.campaign.findMany({
    where: {
      institutionId,
      availableInChatbot: true,
      OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
    },
    include: {
      _count: { select: { raffleNumbers: true } },
      pizzaFlavors: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const eligible: EligibleCampaign[] = [];

  for (const campaign of campaigns) {
    if (campaign.type === "PADRAO") {
      eligible.push({
        id: campaign.id,
        title: campaign.title,
        type: "PADRAO",
        pixKey: campaign.pixKey,
      });
      continue;
    }

    if (campaign.type === "RIFA") {
      if (!campaign.raffleTotalNumbers || !campaign.raffleNumberPrice) continue;
      const remaining =
        campaign.raffleTotalNumbers - campaign._count.raffleNumbers;
      if (remaining <= 0) continue;
      eligible.push({
        id: campaign.id,
        title: campaign.title,
        type: "RIFA",
        pixKey: campaign.pixKey,
        unitPrice: Number(campaign.raffleNumberPrice),
        remaining,
      });
      continue;
    }

    if (campaign.type === "PIZZA") {
      if (campaign.pizzaFlavors.length === 0) continue;
      const soldByFlavor = await prisma.pizzaOrderItem.groupBy({
        by: ["flavorId"],
        where: { flavorId: { in: campaign.pizzaFlavors.map((f) => f.id) } },
        _sum: { quantity: true },
      });
      const soldMap = new Map(
        soldByFlavor.map((s) => [s.flavorId, s._sum.quantity ?? 0]),
      );
      const flavors = campaign.pizzaFlavors
        .map((flavor) => ({
          id: flavor.id,
          name: flavor.name,
          price: Number(flavor.price),
          remaining: flavor.stockQuantity - (soldMap.get(flavor.id) ?? 0),
        }))
        .filter((flavor) => flavor.remaining > 0);
      if (flavors.length === 0) continue;
      eligible.push({
        id: campaign.id,
        title: campaign.title,
        type: "PIZZA",
        pixKey: campaign.pixKey,
        flavors,
      });
    }
  }

  return eligible;
}

// Monta a lista de opções do menu para esta instituição — "Campanha" só
// aparece quando há alguma campanha marcada como disponível no chatbot.
async function buildMenu(institutionId: string) {
  const eligibleCampaigns = await getEligibleChatbotCampaigns(institutionId);
  const options = [...BASE_MENU_OPTIONS];
  if (eligibleCampaigns.length > 0) {
    options.push({ id: "campanha", label: "Campanha" });
  }
  options.push({ id: "secretaria", label: "Secretaria" });
  return { options, eligibleCampaigns };
}

function mainMenuText(name: string, options: MenuOption[]) {
  const lines = options
    .map((option, index) => `${NUMBER_EMOJIS[index] ?? `${index + 1}.`} ${option.label}`)
    .join("\n");

  return `Olá, ${name}! Como posso te ajudar hoje?

${lines}

Responda com o número da opção. Digite *0* a qualquer momento para voltar a este menu.`;
}

// Monta a resposta do menu principal. Quando o Content Template (list-picker)
// correspondente está configurado, envia o menu de verdade como botões
// interativos; sem ele, cai de volta no texto simples numerado.
function menuReply(
  text: string | undefined,
  memberName: string,
  options: MenuOption[],
  hasCampaign: boolean,
): BotReply {
  const contentSid = hasCampaign
    ? process.env.TWILIO_MENU_WITH_CAMPAIGN_CONTENT_SID
    : process.env.TWILIO_MENU_CONTENT_SID;

  if (!contentSid) {
    return {
      text: [text, mainMenuText(memberName, options)].filter(Boolean).join("\n\n"),
    };
  }
  return {
    text,
    content: { contentSid, variables: { "1": memberName } },
  };
}

// Resolve a resposta do usuário (id semântico vindo de um botão tocado, ou
// número digitado à mão) para o id da opção de menu correspondente.
function resolveMenuChoice(choice: string, options: MenuOption[]) {
  const trimmed = choice.trim();
  if (options.some((option) => option.id === trimmed)) {
    return trimmed;
  }
  const index = Number(trimmed) - 1;
  return options[index]?.id;
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

function parseAmount(text: string): number | null {
  const normalized = text
    .trim()
    .replace(/[^\d.,]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const amount = Number(normalized);
  return amount > 0 ? amount : null;
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
  const { options, eligibleCampaigns } = await buildMenu(institution.id);

  return menuReply(
    `Cadastro realizado com sucesso! 🎉\n\n${template?.body ?? defaultWelcome}`,
    member.name,
    options,
    eligibleCampaigns.length > 0,
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

  return `Fale com a secretaria:\n\n${lines.join("\n")}`;
}

async function startCampaignFlow(
  sessionId: string,
  campaign: EligibleCampaign,
): Promise<BotReply> {
  if (campaign.type === "PADRAO") {
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        state: ChatState.AWAITING_CAMPAIGN_AMOUNT,
        context: JSON.stringify({
          campaignId: campaign.id,
          campaignTitle: campaign.title,
        }),
      },
    });
    return {
      text: `Quanto você deseja contribuir para a campanha "${campaign.title}"? Responda só com o número (ex.: 50 ou 50,00).`,
    };
  }

  if (campaign.type === "RIFA") {
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        state: ChatState.AWAITING_RAFFLE_QUANTITY,
        context: JSON.stringify({
          campaignId: campaign.id,
          campaignTitle: campaign.title,
        }),
      },
    });
    return {
      text: `Restam ${campaign.remaining} número(s) da rifa "${campaign.title}" (${formatBRL(campaign.unitPrice)} cada). Quantos números você deseja comprar?`,
    };
  }

  const list = campaign.flavors
    .map(
      (flavor, index) =>
        `${index + 1}️⃣ ${flavor.name} — ${formatBRL(flavor.price)} (${flavor.remaining} disponível(is))`,
    )
    .join("\n");

  await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      state: ChatState.AWAITING_PIZZA_FLAVOR,
      context: JSON.stringify({
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        flavorCandidates: campaign.flavors,
      }),
    },
  });
  return {
    text: `Sabores disponíveis da campanha "${campaign.title}":\n\n${list}\n\nResponda com o número do sabor.`,
  };
}

async function handleCampaignSelection(
  sessionId: string,
  eligibleCampaigns: EligibleCampaign[],
): Promise<BotReply> {
  if (eligibleCampaigns.length === 0) {
    return {
      text: "No momento não há nenhuma campanha disponível para contribuição pelo WhatsApp.",
    };
  }

  if (eligibleCampaigns.length === 1) {
    return startCampaignFlow(sessionId, eligibleCampaigns[0]);
  }

  const list = eligibleCampaigns
    .map((campaign, index) => `${index + 1}️⃣ ${campaign.title}`)
    .join("\n");

  await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      state: ChatState.AWAITING_CAMPAIGN_CHOICE,
      context: JSON.stringify({ campaignCandidates: eligibleCampaigns }),
    },
  });
  return {
    text: `Para qual campanha você deseja contribuir?\n\n${list}\n\nResponda com o número.`,
  };
}

async function handleCampaignChoice(
  sessionId: string,
  contextRaw: string | null,
  body: string,
): Promise<BotReply> {
  const context: { campaignCandidates?: EligibleCampaign[] } = contextRaw
    ? JSON.parse(contextRaw)
    : {};
  const candidates = context.campaignCandidates ?? [];
  const chosen = candidates[Number(body.trim()) - 1];

  if (!chosen) {
    return { text: "Responda com o número de uma das campanhas listadas." };
  }

  return startCampaignFlow(sessionId, chosen);
}

async function handleCampaignAmount(
  member: NonNullable<MemberWithInstitution>,
  sessionId: string,
  contextRaw: string | null,
  body: string,
  options: MenuOption[],
  hasCampaign: boolean,
): Promise<BotReply> {
  const amount = parseAmount(body);
  if (!amount) {
    return {
      text: "Valor inválido. Responda só com o número (ex.: 50 ou 50,00).",
    };
  }

  const context: { campaignId?: string; campaignTitle?: string } = contextRaw
    ? JSON.parse(contextRaw)
    : {};

  const campaign = context.campaignId
    ? await prisma.campaign.findUnique({ where: { id: context.campaignId } })
    : null;

  if (!campaign) {
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { state: ChatState.MAIN_MENU, context: null },
    });
    return menuReply(
      "Essa campanha não está mais disponível.",
      member.name,
      options,
      hasCampaign,
    );
  }

  const { feeAmount, netAmount } = await calculateSplit(
    amount,
    member.institutionId,
  );

  await prisma.contribution.create({
    data: {
      institutionId: member.institutionId,
      memberId: member.id,
      campaignId: campaign.id,
      type: ContributionType.CAMPANHA,
      method: ContributionMethod.PIX,
      status: ContributionStatus.PENDING,
      grossAmount: amount,
      feeAmount,
      netAmount,
    },
  });

  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { state: ChatState.MAIN_MENU, context: null },
  });

  const pixKey = campaign.pixKey ?? member.institution.pixKey;
  const pixLine = pixKey
    ? `Chave Pix para pagamento: \`${pixKey}\``
    : "Nossa secretaria vai entrar em contato para combinar o pagamento.";

  return menuReply(
    `Combinado! Registramos sua contribuição de ${formatBRL(amount)} para a campanha "${campaign.title}".\n\n${pixLine}\n\nAssim que o pagamento for confirmado, você recebe a confirmação por aqui. Obrigado pela generosidade! 💙`,
    member.name,
    options,
    hasCampaign,
  );
}

async function handleRaffleQuantity(
  member: NonNullable<MemberWithInstitution>,
  sessionId: string,
  contextRaw: string | null,
  body: string,
  options: MenuOption[],
  hasCampaign: boolean,
): Promise<BotReply> {
  const context: { campaignId?: string; campaignTitle?: string } = contextRaw
    ? JSON.parse(contextRaw)
    : {};

  const quantity = Number(body.trim().replace(/\D/g, ""));
  if (!quantity) {
    return {
      text: "Quantidade inválida. Responda só com o número de números que deseja comprar (ex.: 2).",
    };
  }

  const campaign = context.campaignId
    ? await prisma.campaign.findUnique({
        where: { id: context.campaignId },
        include: { _count: { select: { raffleNumbers: true } } },
      })
    : null;

  if (!campaign || !campaign.raffleTotalNumbers || !campaign.raffleNumberPrice) {
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { state: ChatState.MAIN_MENU, context: null },
    });
    return menuReply(
      "Essa rifa não está mais disponível.",
      member.name,
      options,
      hasCampaign,
    );
  }

  const soldCount = campaign._count.raffleNumbers;
  const remaining = campaign.raffleTotalNumbers - soldCount;

  if (quantity > remaining) {
    return {
      text: `Só restam ${remaining} número(s) disponível(is) para esta rifa. Responda com uma quantidade menor.`,
    };
  }

  const unitPrice = Number(campaign.raffleNumberPrice);
  const totalAmount = quantity * unitPrice;

  const { feeAmount, netAmount } = await calculateSplit(
    totalAmount,
    member.institutionId,
  );

  // Usa o maior número já atribuído (não a contagem) para gerar os próximos,
  // já que a contagem pode ficar defasada do maior número em uso se algum
  // número for cancelado/excluído no meio da faixa.
  const maxNumberAgg = await prisma.raffleNumber.aggregate({
    where: { campaignId: campaign.id },
    _max: { number: true },
  });
  const nextStart = maxNumberAgg._max.number ?? 0;
  const numbers = Array.from({ length: quantity }, (_, i) => nextStart + i + 1);

  // Contribuição e números da rifa precisam nascer juntos: se a atribuição
  // dos números falhar (ex.: número já ocupado), a contribuição não pode
  // ficar órfã sem número nenhum vinculado.
  await prisma.$transaction(async (tx) => {
    const contribution = await tx.contribution.create({
      data: {
        institutionId: member.institutionId,
        memberId: member.id,
        campaignId: campaign.id,
        type: ContributionType.CAMPANHA,
        method: ContributionMethod.PIX,
        status: ContributionStatus.PENDING,
        grossAmount: totalAmount,
        feeAmount,
        netAmount,
        buyerName: member.name,
        buyerPhone: member.whatsapp,
      },
    });

    for (const number of numbers) {
      await tx.raffleNumber.create({
        data: {
          campaignId: campaign.id,
          number,
          contributionId: contribution.id,
          buyerName: member.name,
          buyerPhone: member.whatsapp,
        },
      });
    }
  });

  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { state: ChatState.MAIN_MENU, context: null },
  });

  const pixKey = campaign.pixKey ?? member.institution.pixKey;
  const pixLine = pixKey
    ? `Chave Pix para pagamento: \`${pixKey}\``
    : "Nossa secretaria vai entrar em contato para combinar o pagamento.";

  return menuReply(
    `Combinado! Reservamos ${quantity} número(s) da rifa "${campaign.title}": ${numbers.join(", ")}.\n\nValor total: ${formatBRL(totalAmount)}.\n\n${pixLine}\n\nAssim que o pagamento for confirmado, sua compra fica garantida. Obrigado pela generosidade! 💙`,
    member.name,
    options,
    hasCampaign,
  );
}

async function handlePizzaFlavorChoice(
  sessionId: string,
  contextRaw: string | null,
  body: string,
): Promise<BotReply> {
  const context: {
    campaignId?: string;
    campaignTitle?: string;
    flavorCandidates?: PizzaFlavorOption[];
  } = contextRaw ? JSON.parse(contextRaw) : {};

  const candidates = context.flavorCandidates ?? [];
  const chosen = candidates[Number(body.trim()) - 1];

  if (!chosen) {
    return { text: "Responda com o número de um dos sabores listados." };
  }

  await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      state: ChatState.AWAITING_PIZZA_QUANTITY,
      context: JSON.stringify({
        campaignId: context.campaignId,
        campaignTitle: context.campaignTitle,
        flavorId: chosen.id,
        flavorName: chosen.name,
      }),
    },
  });

  return {
    text: `Quantas pizzas de ${chosen.name} você deseja? (restam ${chosen.remaining})`,
  };
}

async function handlePizzaQuantity(
  member: NonNullable<MemberWithInstitution>,
  sessionId: string,
  contextRaw: string | null,
  body: string,
  options: MenuOption[],
  hasCampaign: boolean,
): Promise<BotReply> {
  const context: {
    campaignId?: string;
    campaignTitle?: string;
    flavorId?: string;
    flavorName?: string;
  } = contextRaw ? JSON.parse(contextRaw) : {};

  const quantity = Number(body.trim().replace(/\D/g, ""));
  if (!quantity) {
    return {
      text: "Quantidade inválida. Responda só com o número de pizzas que deseja (ex.: 2).",
    };
  }

  const [flavor, campaign] = await Promise.all([
    context.flavorId
      ? prisma.pizzaFlavor.findUnique({ where: { id: context.flavorId } })
      : null,
    context.campaignId
      ? prisma.campaign.findUnique({ where: { id: context.campaignId } })
      : null,
  ]);

  if (!flavor || !campaign) {
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { state: ChatState.MAIN_MENU, context: null },
    });
    return menuReply(
      "Esse sabor não está mais disponível.",
      member.name,
      options,
      hasCampaign,
    );
  }

  const soldAgg = await prisma.pizzaOrderItem.aggregate({
    where: { flavorId: flavor.id },
    _sum: { quantity: true },
  });
  const sold = soldAgg._sum.quantity ?? 0;
  const remaining = flavor.stockQuantity - sold;

  if (quantity > remaining) {
    return {
      text: `Só restam ${remaining} unidade(s) de ${flavor.name}. Responda com uma quantidade menor.`,
    };
  }

  const unitPrice = Number(flavor.price);
  const totalAmount = quantity * unitPrice;

  const { feeAmount, netAmount } = await calculateSplit(
    totalAmount,
    member.institutionId,
  );

  // Contribuição e item do pedido precisam nascer juntos: se um dos dois
  // falhar, o outro não pode ficar órfão.
  await prisma.$transaction(async (tx) => {
    const contribution = await tx.contribution.create({
      data: {
        institutionId: member.institutionId,
        memberId: member.id,
        campaignId: campaign.id,
        type: ContributionType.CAMPANHA,
        method: ContributionMethod.PIX,
        status: ContributionStatus.PENDING,
        grossAmount: totalAmount,
        feeAmount,
        netAmount,
        buyerName: member.name,
        buyerPhone: member.whatsapp,
      },
    });

    await tx.pizzaOrderItem.create({
      data: {
        flavorId: flavor.id,
        contributionId: contribution.id,
        quantity,
        buyerName: member.name,
        buyerPhone: member.whatsapp,
      },
    });
  });

  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { state: ChatState.MAIN_MENU, context: null },
  });

  const pixKey = campaign.pixKey ?? member.institution.pixKey;
  const pixLine = pixKey
    ? `Chave Pix para pagamento: \`${pixKey}\``
    : "Nossa secretaria vai entrar em contato para combinar o pagamento.";

  return menuReply(
    `Combinado! Registramos seu pedido de ${quantity}x ${flavor.name} da campanha "${campaign.title}".\n\nValor total: ${formatBRL(totalAmount)}.\n\n${pixLine}\n\nAssim que o pagamento for confirmado, você recebe a confirmação por aqui. Obrigado pela generosidade! 💙`,
    member.name,
    options,
    hasCampaign,
  );
}

async function handleMainMenuChoice(
  member: NonNullable<MemberWithInstitution>,
  sessionId: string,
  choice: string,
  options: MenuOption[],
  eligibleCampaigns: EligibleCampaign[],
): Promise<BotReply> {
  const resolved = resolveMenuChoice(choice, options);

  switch (resolved) {
    case "missas":
      return { text: await handleMassSchedulesAndEvents(member.institutionId) };

    case "oracao":
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { state: ChatState.AWAITING_PRAYER_REQUEST },
      });
      return {
        text: "Pode escrever seu pedido de oração. Vamos rezar por essa intenção. 🙏",
      };

    case "dizimo":
    case "oferta": {
      const type = resolved === "dizimo" ? "DIZIMO" : "OFERTA";
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

    case "historico":
      return { text: await handleContributionHistory(member.id) };

    case "campanha":
      return handleCampaignSelection(sessionId, eligibleCampaigns);

    case "secretaria":
      return { text: await handlePastoralContact(member.institutionId) };

    default:
      return menuReply(
        "Não entendi sua resposta.",
        member.name,
        options,
        eligibleCampaigns.length > 0,
      );
  }
}

async function handlePrayerRequest(
  member: NonNullable<MemberWithInstitution>,
  sessionId: string,
  phone: string,
  body: string,
  options: MenuOption[],
  hasCampaign: boolean,
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
    options,
    hasCampaign,
  );
}

async function handleContributionAmount(
  member: NonNullable<MemberWithInstitution>,
  sessionId: string,
  contextRaw: string | null,
  body: string,
  options: MenuOption[],
  hasCampaign: boolean,
): Promise<BotReply> {
  const amount = parseAmount(body);
  if (!amount) {
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
    options,
    hasCampaign,
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

  const { options, eligibleCampaigns } = await buildMenu(member.institutionId);
  const hasCampaign = eligibleCampaigns.length > 0;

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

    return menuReply(welcomeText, member.name, options, hasCampaign);
  }

  switch (session.state) {
    case ChatState.AWAITING_PRAYER_REQUEST:
      return handlePrayerRequest(
        member,
        session.id,
        digits,
        body,
        options,
        hasCampaign,
      );
    case ChatState.AWAITING_CONTRIBUTION_AMOUNT:
      return handleContributionAmount(
        member,
        session.id,
        session.context,
        body,
        options,
        hasCampaign,
      );
    case ChatState.AWAITING_CAMPAIGN_CHOICE:
      return handleCampaignChoice(session.id, session.context, body);
    case ChatState.AWAITING_CAMPAIGN_AMOUNT:
      return handleCampaignAmount(
        member,
        session.id,
        session.context,
        body,
        options,
        hasCampaign,
      );
    case ChatState.AWAITING_RAFFLE_QUANTITY:
      return handleRaffleQuantity(
        member,
        session.id,
        session.context,
        body,
        options,
        hasCampaign,
      );
    case ChatState.AWAITING_PIZZA_FLAVOR:
      return handlePizzaFlavorChoice(session.id, session.context, body);
    case ChatState.AWAITING_PIZZA_QUANTITY:
      return handlePizzaQuantity(
        member,
        session.id,
        session.context,
        body,
        options,
        hasCampaign,
      );
    case ChatState.MAIN_MENU:
    default:
      return handleMainMenuChoice(
        member,
        session.id,
        body,
        options,
        eligibleCampaigns,
      );
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
