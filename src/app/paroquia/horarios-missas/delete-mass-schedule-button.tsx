"use client";

import { Trash2 } from "lucide-react";
import { deleteMassSchedule } from "@/app/actions/mass-schedule";

export function DeleteMassScheduleButton({
  massScheduleId,
}: {
  massScheduleId: string;
}) {
  const deleteForSchedule = deleteMassSchedule.bind(null, massScheduleId);

  return (
    <form action={deleteForSchedule}>
      <button
        type="submit"
        aria-label="Remover horário"
        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}
