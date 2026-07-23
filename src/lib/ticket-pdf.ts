import "server-only";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { TICKET_CATEGORY_LABELS } from "@/lib/labels";

type TicketForPdf = {
  id: string;
  qrCode: string;
  category: string;
  event: { title: string };
};

type SaleForPdf = {
  buyerName: string | null;
  tickets: TicketForPdf[];
};

export async function generateTicketsPdf(sale: SaleForPdf): Promise<Buffer> {
  const qrBuffers = await Promise.all(
    sale.tickets.map((ticket) => QRCode.toBuffer(ticket.qrCode, { width: 240 })),
  );

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const QR_SIZE = 160;
    const CARD_WIDTH = 240;
    const CARD_HEIGHT = 260;
    const MARGIN = 40;
    const pageWidth = doc.page.width - MARGIN * 2;
    const columns = Math.max(1, Math.floor(pageWidth / CARD_WIDTH));

    doc
      .fontSize(16)
      .text(`Ingressos${sale.buyerName ? ` — ${sale.buyerName}` : ""}`, {
        align: "left",
      });
    doc.moveDown();

    let column = 0;
    let x = MARGIN;
    let y = doc.y;

    for (let i = 0; i < sale.tickets.length; i++) {
      const ticket = sale.tickets[i];

      if (y + CARD_HEIGHT > doc.page.height - MARGIN) {
        doc.addPage();
        y = MARGIN;
        column = 0;
        x = MARGIN;
      }

      doc.image(qrBuffers[i], x, y, { width: QR_SIZE, height: QR_SIZE });
      doc
        .fontSize(11)
        .text(ticket.event.title, x, y + QR_SIZE + 8, { width: CARD_WIDTH - 10 })
        .fontSize(10)
        .fillColor("#64748b")
        .text(
          `${TICKET_CATEGORY_LABELS[ticket.category] ?? ticket.category} — Ingresso #${i + 1}`,
          x,
          doc.y,
          { width: CARD_WIDTH - 10 },
        )
        .fillColor("#000000");

      column++;
      if (column >= columns) {
        column = 0;
        x = MARGIN;
        y += CARD_HEIGHT;
      } else {
        x += CARD_WIDTH;
      }
    }

    doc.end();
  });
}
