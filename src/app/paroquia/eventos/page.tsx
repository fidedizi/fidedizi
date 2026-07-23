import { requireParoquiaContext } from "@/lib/selected-institution";
import { requirePermission } from "@/lib/permissions";
import { PermissionModule } from "@/generated/prisma/client";
import { listEventsWithStats } from "@/lib/queries/events";
import { listMemberSearchOptions } from "@/lib/queries/members";
import { NewEventModal } from "./event-form-modal";
import { EventCard } from "./event-card";

export default async function EventosPage() {
  const { user, institution } = await requireParoquiaContext();
  await requirePermission(user, PermissionModule.AGENDA);
  const [events, members] = await Promise.all([
    listEventsWithStats(institution.id),
    listMemberSearchOptions(institution.id),
  ]);

  const activeCount = events.filter((e) => e.status === "ATIVO").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Eventos & Festas
          </h2>
          <p className="text-sm text-slate-500">
            {institution.name} — {events.length} eventos · {activeCount} ativos
          </p>
        </div>
        <NewEventModal />
      </div>

      {events.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-400">
          Nenhum evento cadastrado ainda.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            memberOptions={members.map((m) => ({
              id: m.id,
              name: m.name,
              whatsapp: m.whatsapp,
              email: m.email ?? "",
            }))}
          />
        ))}
      </div>
    </div>
  );
}
