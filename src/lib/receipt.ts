import "server-only";

export const CONTRIBUTION_TYPE_LABELS: Record<string, string> = {
  DIZIMO: "Dízimo",
  OFERTA: "Oferta",
  CAMPANHA: "Campanha",
  EVENTO: "Evento",
};

function renderTemplate(body: string, variables: Record<string, string>) {
  return Object.entries(variables).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, value),
    body,
  );
}

// Identifica sempre qual instituição (paróquia/capela/comunidade) está
// enviando a mensagem, independentemente de o corpo ter sido personalizado
// em Avisos — não é algo que a personalização deve poder omitir.
export function withInstitutionHeader(institutionName: string, message: string) {
  return `*${institutionName}*\n\n${message}`;
}

export function buildReceiptMessage(
  templateBody: string | undefined,
  variables: { nome: string; valor: string; tipo: string; data: string },
) {
  const defaultBody =
    "Olá {{nome}}, recebemos sua contribuição de {{tipo}} no valor de {{valor}} em {{data}}. Obrigado pela sua generosidade!";
  return renderTemplate(templateBody ?? defaultBody, variables);
}

export function buildRaffleMessage(
  templateBody: string | undefined,
  variables: { nome: string; campanha: string; numeros: string; valor: string },
) {
  const defaultBody =
    'Olá {{nome}}! Sua compra na rifa da campanha "{{campanha}}" foi confirmada. Seu(s) número(s): {{numeros}}. Valor pago: {{valor}}. Boa sorte e obrigado por contribuir!';
  return renderTemplate(templateBody ?? defaultBody, variables);
}

export function buildPizzaOrderMessage(
  templateBody: string | undefined,
  variables: { nome: string; campanha: string; itens: string; valor: string },
) {
  const defaultBody =
    'Olá {{nome}}! Seu pedido na campanha "{{campanha}}" foi confirmado: {{itens}}. Valor total: {{valor}}. Obrigado por contribuir!';
  return renderTemplate(templateBody ?? defaultBody, variables);
}

export function buildTicketOrderMessage(
  templateBody: string | undefined,
  variables: { nome: string; evento: string; itens: string; valor: string },
) {
  const defaultBody =
    'Olá {{nome}}! Sua compra de ingressos para "{{evento}}" foi confirmada: {{itens}}. Valor total: {{valor}}. Seus ingressos com QR Code estão no PDF anexo. Te esperamos lá!';
  return renderTemplate(templateBody ?? defaultBody, variables);
}

export function buildBirthdayMessage(
  templateBody: string | undefined,
  variables: { nome: string; "nomedaparoquia/capela/comunidade": string },
) {
  const defaultBody =
    "🎉 Feliz aniversário, {{nome}}! Que Deus continue abençoando sua vida. Toda a nossa comunidade celebra com você hoje!";
  return renderTemplate(templateBody ?? defaultBody, variables);
}

export function buildTitheReminderMessage(
  templateBody: string | undefined,
  variables: { nome: string },
) {
  const defaultBody =
    "Olá {{nome}}, notamos que seu dízimo está em atraso. Contamos com sua contribuição para continuar nossa missão. Que Deus lhe recompense!";
  return renderTemplate(templateBody ?? defaultBody, variables);
}
