import twilio from "twilio";
import { handleIncomingWhatsAppMessage, buildTwiml } from "@/lib/whatsapp-bot";

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
  const body = params.Body ?? "";

  let replyText: string;
  try {
    replyText = await handleIncomingWhatsAppMessage(from, body);
  } catch (error) {
    console.error("[WhatsApp Bot] Erro ao processar mensagem:", error);
    replyText =
      "Desculpe, tivemos um problema ao processar sua mensagem. Tente novamente em instantes.";
  }

  return new Response(buildTwiml(replyText), {
    headers: { "Content-Type": "text/xml" },
  });
}
