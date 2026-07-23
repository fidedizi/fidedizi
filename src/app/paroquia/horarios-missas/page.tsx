import { requireParoquiaContext } from "@/lib/selected-institution";
import { requirePermission } from "@/lib/permissions";
import { PermissionModule } from "@/generated/prisma/client";
import { listMassSchedules } from "@/lib/queries/mass-schedule";
import { WEEKDAY_LABELS } from "@/lib/labels";
import { MassScheduleForm } from "./mass-schedule-form";
import { DeleteMassScheduleButton } from "./delete-mass-schedule-button";

const WEEKDAY_ORDER = Object.keys(WEEKDAY_LABELS);

export default async function HorariosMissasPage() {
  const { user, institution } = await requireParoquiaContext();
  await requirePermission(user, PermissionModule.AGENDA);

  const schedules = await listMassSchedules(institution.id);
  const schedulesByDay = new Map(
    WEEKDAY_ORDER.map((day) => [
      day,
      schedules.filter((s) => s.dayOfWeek === day),
    ]),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          Horários de Missas
        </h2>
        <p className="text-base font-semibold text-slate-600">
          {institution.name}
        </p>
      </div>

      <MassScheduleForm />

      <div className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {WEEKDAY_ORDER.map((day) => {
          const daySchedules = schedulesByDay.get(day) ?? [];
          return (
            <div
              key={day}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-4"
            >
              <h3 className="w-36 shrink-0 text-sm font-semibold text-slate-800">
                {WEEKDAY_LABELS[day]}
              </h3>
              {daySchedules.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Nenhum horário cadastrado.
                </p>
              ) : (
                <div className="flex flex-1 flex-wrap gap-2">
                  {daySchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {schedule.time}
                        </p>
                        {schedule.description && (
                          <p className="text-xs text-slate-500">
                            {schedule.description}
                          </p>
                        )}
                      </div>
                      <DeleteMassScheduleButton massScheduleId={schedule.id} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
