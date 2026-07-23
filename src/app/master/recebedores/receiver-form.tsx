"use client";

import { useActionState } from "react";
import { useActionToast } from "@/components/use-action-toast";
import { upsertReceiver } from "@/app/actions/receivers";
import { GATEWAY_PROVIDER_LABELS } from "@/lib/labels";

type InstitutionOption = {
  id: string;
  name: string;
};

export function ReceiverForm({
  institutionOptions,
}: {
  institutionOptions: InstitutionOption[];
}) {
  const [state, action, pending] = useActionState(upsertReceiver, undefined);
  useActionToast(state);

  return (
    <form
      action={action}
      className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4"
    >
      <div className="flex flex-col gap-1">
        <label
          htmlFor="institutionId"
          className="text-sm font-medium text-slate-700"
        >
          Instituição
        </label>
        <select
          id="institutionId"
          name="institutionId"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Selecione...</option>
          {institutionOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        {state?.errors?.institutionId && (
          <p className="text-sm text-red-600">
            {state.errors.institutionId[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="gatewayProvider"
          className="text-sm font-medium text-slate-700"
        >
          Gateway
        </label>
        <select
          id="gatewayProvider"
          name="gatewayProvider"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {Object.entries(GATEWAY_PROVIDER_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="externalId"
          className="text-sm font-medium text-slate-700"
        >
          ID do Recebedor
        </label>
        <input
          id="externalId"
          name="externalId"
          type="text"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {state?.errors?.externalId && (
          <p className="text-sm text-red-600">
            {state.errors.externalId[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 justify-end">
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-md bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0B2545]/90 disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Registrar recebedor"}
        </button>
      </div>
    </form>
  );
}
