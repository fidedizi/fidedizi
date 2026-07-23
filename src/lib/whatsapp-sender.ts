import "server-only";
import twilio from "twilio";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;

const client =
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
    ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    : null;

// Aceita números em qualquer formatação (com/sem DDI, com parênteses e
// traços) e normaliza para E.164 assumindo Brasil (+55).
function toE164BR(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const withCountryCode = digits.startsWith("55") ? digits : `55${digits}`;
  return `+${withCountryCode}`;
}

// Números de celular brasileiros que já existiam no WhatsApp antes da adoção
// nacional do "nono dígito" às vezes ficaram registrados na conta do WhatsApp
// no formato antigo (8 dígitos no número local), mesmo a linha discando hoje
// com 9. Não dá para saber qual variante bate com a conta sem tentar — esta
// função alterna entre as duas formas.
function toggleNinthDigit(e164: string) {
  const match = e164.match(/^\+55(\d{2})(\d{8,9})$/);
  if (!match) return null;
  const [, ddd, subscriberNumber] = match;
  if (subscriberNumber.length === 9 && subscriberNumber.startsWith("9")) {
    return `+55${ddd}${subscriberNumber.slice(1)}`;
  }
  if (subscriberNumber.length === 8) {
    return `+55${ddd}9${subscriberNumber}`;
  }
  return null;
}

const FAILED_STATUSES = new Set(["failed", "undelivered"]);
const FINAL_STATUSES = new Set(["delivered", "read", "failed", "undelivered"]);

// Aguarda um resultado final de entrega (a criação da mensagem só confirma
// que ela foi aceita na fila, não que chegou de fato). Desiste depois de
// alguns segundos e assume que está a caminho.
async function waitForOutcome(sid: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const fetched = await client!.messages(sid).fetch();
    if (FINAL_STATUSES.has(fetched.status)) {
      return fetched;
    }
  }
  return null;
}

// Tenta enviar com o anexo; se a Twilio rejeitar a mídia (ex.: URL
// inacessível, como localhost em ambiente de desenvolvimento), reenvia só o
// texto em vez de perder a mensagem inteira.
async function createMessage(to: string, message: string, mediaUrl?: string) {
  try {
    return await client!.messages.create({
      from: TWILIO_WHATSAPP_FROM!,
      to,
      body: message,
      ...(mediaUrl ? { mediaUrl: [mediaUrl] } : {}),
    });
  } catch (error) {
    if (!mediaUrl) throw error;
    console.error(
      `[WhatsApp] Não foi possível anexar a mídia (${mediaUrl}) — enviando só o texto:`,
      error,
    );
    return client!.messages.create({
      from: TWILIO_WHATSAPP_FROM!,
      to,
      body: message,
    });
  }
}

// Usada só pelo chatbot: o número de destino já vem exatamente como a
// Twilio nos entregou na mensagem recebida (sem a ambiguidade do "nono
// dígito" de um envio às cegas), então não precisa do fallback abaixo.
export async function sendContentMessage(
  to: string,
  contentSid: string,
  variables?: Record<string, string>,
) {
  if (!client || !TWILIO_WHATSAPP_FROM) {
    console.log(
      `[WhatsApp] Twilio não configurado — menu interativo simulado para ${to} (contentSid=${contentSid})`,
    );
    return;
  }

  try {
    await client.messages.create({
      from: TWILIO_WHATSAPP_FROM,
      to,
      contentSid,
      ...(variables ? { contentVariables: JSON.stringify(variables) } : {}),
    });
  } catch (error) {
    console.error(`[WhatsApp] Falha ao enviar menu interativo para ${to}:`, error);
  }
}

export async function sendWhatsAppMessage(
  phone: string,
  message: string,
  mediaUrl?: string,
) {
  if (!client || !TWILIO_WHATSAPP_FROM) {
    console.log(
      `[WhatsApp] Twilio não configurado — envio simulado para ${phone}:\n${message}${
        mediaUrl ? `\n[anexo: ${mediaUrl}]` : ""
      }`,
    );
    return;
  }

  const primaryNumber = toE164BR(phone);

  try {
    const sent = await createMessage(
      `whatsapp:${primaryNumber}`,
      message,
      mediaUrl,
    );

    const outcome = await waitForOutcome(sent.sid);
    if (!outcome || !FAILED_STATUSES.has(outcome.status)) {
      return;
    }

    const alternateNumber = toggleNinthDigit(primaryNumber);
    if (!alternateNumber) return;

    await createMessage(`whatsapp:${alternateNumber}`, message, mediaUrl);
  } catch (error) {
    // Falha no envio de WhatsApp não pode derrubar a operação principal
    // (ex.: registrar uma venda ou contribuição), então só logamos o erro.
    console.error(`[WhatsApp] Falha ao enviar para ${phone}:`, error);
  }
}
