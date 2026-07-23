import { requireParoquiaContext } from "@/lib/selected-institution";
import { requirePermission } from "@/lib/permissions";
import { PermissionModule } from "@/generated/prisma/client";
import { listMessageSchedules, listMessageTemplates } from "@/lib/queries/messages";
import {
  MESSAGE_SCHEDULE_STATUS_LABELS,
  MESSAGE_TRIGGER_LABELS,
} from "@/lib/labels";
import { TemplateForm } from "./template-form";
import { ScheduleForm } from "./schedule-form";

export default async function AvisosPage() {
  const { user, institution } = await requireParoquiaContext();
  await requirePermission(user, PermissionModule.AVISOS);

  const [templates, schedules] = await Promise.all([
    listMessageTemplates(institution.id),
    listMessageSchedules(institution.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          Agendamento de Envio
        </h2>
        <p className="text-base font-semibold text-slate-600">{institution.name}</p>
      </div>

      <p className="text-sm text-slate-500">
        O disparo automático depende da integração com o WhatsApp (Meta
        Cloud API), que ainda não está configurada — por ora, o agendamento
        fica registrado com status &quot;{
          MESSAGE_SCHEDULE_STATUS_LABELS.AWAITING_SCHEDULE
        }&quot; ou &quot;{MESSAGE_SCHEDULE_STATUS_LABELS.SCHEDULED}&quot;.
      </p>

      <ScheduleForm />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Gatilho</th>
              <th className="px-4 py-2 font-medium">Agendado para</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Criado em</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {schedules.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  Nenhum agendamento registrado ainda.
                </td>
              </tr>
            )}
            {schedules.map((schedule) => (
              <tr
                key={schedule.id}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="px-4 py-2">
                  {MESSAGE_TRIGGER_LABELS[schedule.trigger]}
                </td>
                <td className="px-4 py-2">
                  {schedule.scheduledFor
                    ? schedule.scheduledFor.toLocaleString("pt-BR")
                    : "—"}
                </td>
                <td className="px-4 py-2">
                  {MESSAGE_SCHEDULE_STATUS_LABELS[schedule.status]}
                </td>
                <td className="px-4 py-2">
                  {schedule.createdAt.toLocaleString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-lg font-semibold text-slate-800">
        Personalização de Mensagens
      </h3>

      <div className="flex flex-col gap-4">
        {templates.map((template) => (
          <TemplateForm
            key={template.trigger}
            trigger={template.trigger}
            initialBody={template.body}
          />
        ))}
      </div>
    </div>
  );
}
