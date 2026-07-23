"use client";

import { useActionState } from "react";
import { useActionToast } from "@/components/use-action-toast";
import { createInstitution } from "@/app/actions/institutions";
import { INSTITUTION_TYPE_LABELS } from "@/lib/labels";

type InstitutionOption = {
  id: string;
  name: string;
};

export function InstitutionForm({
  parentOptions,
}: {
  parentOptions: InstitutionOption[];
}) {
  const [state, action, pending] = useActionState(
    createInstitution,
    undefined,
  );
  useActionToast(state);

  return (
    <form
      action={action}
      className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="type" className="text-sm font-medium text-slate-700">
          Tipo
        </label>
        <select
          id="type"
          name="type"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {Object.entries(INSTITUTION_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {state?.errors?.type && (
          <p className="text-sm text-red-600">{state.errors.type[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Nome
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {state?.errors?.name && (
          <p className="text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="cnpj" className="text-sm font-medium text-slate-700">
          CNPJ (14 dígitos)
        </label>
        <input
          id="cnpj"
          name="cnpj"
          type="text"
          inputMode="numeric"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {state?.errors?.cnpj && (
          <p className="text-sm text-red-600">{state.errors.cnpj[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="parentId"
          className="text-sm font-medium text-slate-700"
        >
          Instituição Superior
        </label>
        <select
          id="parentId"
          name="parentId"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Nenhuma (raiz)</option>
          {parentOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-4">
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-md bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0B2545]/90 disabled:opacity-60"
        >
          {pending ? "Cadastrando..." : "Cadastrar instituição"}
        </button>
      </div>
    </form>
  );
}
