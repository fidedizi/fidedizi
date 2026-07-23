import { getSaleForPdf } from "@/lib/queries/events";
import { generateTicketsPdf } from "@/lib/ticket-pdf";

// Rota pública (sem sessão) para que a Twilio consiga baixar o PDF ao enviar
// a mensagem de WhatsApp. O contributionId (cuid) funciona como identificador
// não adivinhável — não expõe nada além dos QR Codes da própria venda.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ contributionId: string }> },
) {
  const { contributionId } = await params;

  const sale = await getSaleForPdf(contributionId);

  if (!sale) {
    return new Response("Ingressos não encontrados.", { status: 404 });
  }

  const pdf = await generateTicketsPdf(sale);

  return new Response(Uint8Array.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=\"ingressos.pdf\"",
    },
  });
}
