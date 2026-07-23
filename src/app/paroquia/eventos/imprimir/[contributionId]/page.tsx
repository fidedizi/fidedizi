import QRCode from "qrcode";
import { notFound } from "next/navigation";
import { requireParoquiaContext } from "@/lib/selected-institution";
import { requirePermission } from "@/lib/permissions";
import { PermissionModule } from "@/generated/prisma/client";
import { getSaleForPrinting } from "@/lib/queries/events";
import { TICKET_CATEGORY_LABELS } from "@/lib/labels";
import { PrintButton } from "./print-button";

export default async function ImprimirIngressosPage({
  params,
}: {
  params: Promise<{ contributionId: string }>;
}) {
  const { user, institution } = await requireParoquiaContext();
  await requirePermission(user, PermissionModule.AGENDA);
  const { contributionId } = await params;

  const sale = await getSaleForPrinting(contributionId, institution.id);

  if (!sale) {
    notFound();
  }

  const ticketsWithQrCode = await Promise.all(
    sale.tickets.map(async (ticket) => ({
      ...ticket,
      qrDataUrl: await QRCode.toDataURL(ticket.qrCode),
    })),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between print:hidden">
        <h2 className="text-xl font-semibold text-slate-800">
          {sale.buyerName ?? "Venda"} — {ticketsWithQrCode.length} ingresso(s)
        </h2>
        <PrintButton />
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {ticketsWithQrCode.map((ticket, index) => (
          <div
            key={ticket.id}
            className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 text-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ticket.qrDataUrl}
              alt={`QR Code do ingresso ${index + 1}`}
              className="h-32 w-32"
            />
            <p className="text-sm font-medium text-slate-700">
              {ticket.event.title}
            </p>
            <p className="text-xs text-slate-500">
              {TICKET_CATEGORY_LABELS[ticket.category]}
            </p>
            <p className="text-xs text-slate-400">Ingresso #{index + 1}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
