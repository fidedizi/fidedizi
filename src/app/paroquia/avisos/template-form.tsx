"use client";

import { useActionState } from "react";
import { useActionToast } from "@/components/use-action-toast";
import { upsertMessageTemplate } from "@/app/actions/messages";
import { MESSAGE_TRIGGER_LABELS } from "@/lib/labels";

export function TemplateForm({
  trigger,
  initialBody,
}: {
  trigger: string;
  initialBody: string;
}) {
  const [state, action, pending] = useActionState(
    upsertMessageTemplate,
    undefined,
  );
  useActionToast(state);

  return (
    <form
      action={action}
      className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4"
    >
      <input type="hidden" name="trigger" value={trigger} />

      <label className="text-sm font-medium text-slate-700">
        {MESSAGE_TRIGGER_LABELS[trigger]}
      </label>
      <textarea
        name="body"
        defaultValue={initialBody}
        rows={2}
        required
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      {state?.errors?.body && (
        <p className="text-sm text-red-600">{state.errors.body[0]}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-md border border-[#0B2545] px-3 py-1.5 text-sm font-medium text-[#0B2545] transition hover:bg-[#0B2545]/5 disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
