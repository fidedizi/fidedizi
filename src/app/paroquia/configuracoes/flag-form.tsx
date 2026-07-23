"use client";

import { useActionState } from "react";
import { useActionToast } from "@/components/use-action-toast";
import { createFlag } from "@/app/actions/members";

export function FlagForm() {
  const [state, action, pending] = useActionState(createFlag, undefined);
  useActionToast(state);

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end"
    >
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor="flagName" className="text-sm font-medium text-slate-700">
          Nova pastoral/movimento (ex.: Catequese, ECC, Ministros)
        </label>
        <input
          id="flagName"
          name="name"
          type="text"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {state?.errors?.name && (
          <p className="text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md border border-[#0B2545] px-4 py-2 text-sm font-semibold text-[#0B2545] transition hover:bg-[#0B2545]/5 disabled:opacity-60"
      >
        {pending ? "Adicionando..." : "Adicionar pastoral"}
      </button>
    </form>
  );
}
