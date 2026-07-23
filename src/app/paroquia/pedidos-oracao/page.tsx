import { requireParoquiaContext } from "@/lib/selected-institution";
import { requirePermission } from "@/lib/permissions";
import { PermissionModule } from "@/generated/prisma/client";
import { listPrayerRequests } from "@/lib/queries/prayer-requests";
import { formatWhatsApp } from "@/lib/whatsapp";

export default async function PedidosOracaoPage() {
  const { user, institution } = await requireParoquiaContext();
  await requirePermission(user, PermissionModule.AVISOS);

  const prayerRequests = await listPrayerRequests(institution.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          Pedidos de Oração
        </h2>
        <p className="text-base font-semibold text-slate-600">
          {institution.name}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {prayerRequests.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-400">
            Nenhum pedido de oração recebido pelo WhatsApp ainda.
          </p>
        )}
        {prayerRequests.map((request) => (
          <div
            key={request.id}
            className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-slate-800">
                {request.member?.name ?? "Fiel não identificado"}
              </p>
              <span className="whitespace-nowrap text-xs text-slate-400">
                {request.createdAt.toLocaleString("pt-BR")}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {formatWhatsApp(request.phone)}
            </p>
            <p className="mt-1 text-sm text-slate-700">{request.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
