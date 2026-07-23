"use client";

import { useActionState } from "react";
import { useActionToast } from "@/components/use-action-toast";
import { createMessageSchedule } from "@/app/actions/messages";
import { MESSAGE_TRIGGER_LABELS } from "@/lib/labels";

export function ScheduleForm() {
  const [state, action, pending] = useActionState(
    createMessageSchedule,
    undefined,
  );
  useActionToast(state);

  return (
    <form
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className="flex flex-col gap-1">
        <label
          htmlFor="scheduleTrigger"
          className="text-sm font-medium text-slate-700"
        >
          Gatilho
        </label>
        <select
          id="scheduleTrigger"
          name="trigger"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {Object.entries(MESSAGE_TRIGGER_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="scheduledFor"
          className="text-sm font-medium text-slate-700"
        >
          Data/hora do envio (opcional)
        </label>
        <input
          id="scheduledFor"
          name="scheduledFor"
          type="datetime-local"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0B2545]/90 disabled:opacity-60"
      >
        {pending ? "Registrando..." : "Registrar agendamento"}
      </button>
    </form>
  );
}
