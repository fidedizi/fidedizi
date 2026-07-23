"use client";

import { useActionState, useEffect, useState } from "react";
import { useActionToast } from "@/components/use-action-toast";
import { createMassSchedule } from "@/app/actions/mass-schedule";
import { WEEKDAY_LABELS } from "@/lib/labels";

export function MassScheduleForm() {
  const [state, action, pending] = useActionState(createMassSchedule, undefined);
  useActionToast(state);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (state?.message) {
      setFormKey((k) => k + 1);
    }
  }, [state?.message]);

  return (
    <form
      key={formKey}
      action={action}
      className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="dayOfWeek" className="text-sm font-medium text-slate-700">
          Dia da semana
        </label>
        <select
          id="dayOfWeek"
          name="dayOfWeek"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {Object.entries(WEEKDAY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {state?.errors?.dayOfWeek && (
          <p className="text-sm text-red-600">{state.errors.dayOfWeek[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="time" className="text-sm font-medium text-slate-700">
          Horário
        </label>
        <input
          id="time"
          name="time"
          type="time"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {state?.errors?.time && (
          <p className="text-sm text-red-600">{state.errors.time[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1 sm:col-span-2">
        <label
          htmlFor="description"
          className="text-sm font-medium text-slate-700"
        >
          Descrição (opcional)
        </label>
        <input
          id="description"
          name="description"
          type="text"
          placeholder="Ex.: Missa Solene, Missa das Crianças"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="sm:col-span-4">
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-md bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0B2545]/90 disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Adicionar horário"}
        </button>
      </div>
    </form>
  );
}
