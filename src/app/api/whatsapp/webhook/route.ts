import twilio from "twilio";
import {
  handleIncomingWhatsAppMessage,
  buildTwiml,
  type BotReply,
} from "@/lib/whatsapp-bot";
import { sendContentMessage, sendPlainTextMessage } from "@/lib/whatsapp-sender";

// Webhook público (sem sessão) chamado diretamente pela Twilio a cada
// mensagem de WhatsApp recebida. A autenticidade é garantida pela assinatura
// X-Twilio-Signature (validada com o Auth Token), não por login.
export async function POST(request: Request) {
  const formData = await request.formData();
  const params = Object.fromEntries(formData.entries()) as Record<
    string,
    string
  >;

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (authToken) {
    const signature = request.headers.get("x-twilio-signature") ?? "";
    const webhookUrl = `${process.env.APP_URL ?? "http://localhost:3001"}/api/whatsapp/webhook`;
    const isValid = twilio.validateRequest(
      authToken,
      signature,
      webhookUrl,
      params,
    );
    if (!isValid) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const from = params.From ?? "";
  // Ao tocar num botão/item de lista, a Twilio manda a escolha em
  // ButtonPayload (o "id" que definimos no Content Template) em vez de Body.
  const body = params.ButtonPayload || params.Body || "";

  let reply: BotReply;
  try {
    reply = await handleIncomingWhatsAppMessage(from, body);
  } catch (error) {
    console.error("[WhatsApp Bot] Erro ao processar mensagem:", error);
    reply = {
      text: "Desculpe, tivemos um problema ao processar sua mensagem. Tente novamente em instantes.",
    };
  }

  if (reply.content) {
    // Quando a resposta tem texto E menu interativo, os dois viram mensagens
    // separadas (TwiML só carrega uma). Manda o texto primeiro e aguarda,
    // senão a chamada REST do menu (mais rápida) chega antes e a conversa
    // fica com a ordem invertida — como se o bot tivesse respondido "não
    // entendi" depois de já ter mostrado o menu.
    if (reply.text) {
      await sendPlainTextMessage(from, reply.text);
    }
    await sendContentMessage(from, reply.content.contentSid, reply.content.variables);
    return new Response(buildTwiml(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  return new Response(buildTwiml(reply.text), {
    headers: { "Content-Type": "text/xml" },
  });
}
