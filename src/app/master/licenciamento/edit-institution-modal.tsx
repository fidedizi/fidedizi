"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
import { Modal } from "@/components/modal";
import { useActionToast, useCloseOnSuccess } from "@/components/use-action-toast";
import { updateInstitution } from "@/app/actions/institutions";
import { INSTITUTION_TYPE_LABELS } from "@/lib/labels";

type InstitutionOption = {
  id: string;
  name: string;
};

type InstitutionData = {
  id: string;
  type: string;
  name: string;
  cnpj: string;
  parentId: string;
};

export function EditInstitutionModal({
  institution,
  parentOptions,
}: {
  institution: InstitutionData;
  parentOptions: InstitutionOption[];
}) {
  const [open, setOpen] = useState(false);
  const updateForInstitution = updateInstitution.bind(null, institution.id);
  const [state, action, pending] = useActionState(
    updateForInstitution,
    undefined,
  );
  useActionToast(state);
  useCloseOnSuccess(state, () => setOpen(false));

  const availableParents = parentOptions.filter(
    (option) => option.id !== institution.id,
  );

  const typeId = `edit-type-${institution.id}`;
  const nameId = `edit-name-${institution.id}`;
  const cnpjId = `edit-cnpj-${institution.id}`;
  const parentIdId = `edit-parentId-${institution.id}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Editar instituição"
        className="flex items-center gap-1.5 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
      >
        <Pencil className="h-3.5 w-3.5" /> Editar
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Editar Instituição"
      >
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor={typeId} className="text-sm font-medium text-slate-700">
              Tipo
            </label>
            <select
              id={typeId}
              name="type"
              defaultValue={institution.type}
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
            <label htmlFor={nameId} className="text-sm font-medium text-slate-700">
              Nome
            </label>
            <input
              id={nameId}
              name="name"
              type="text"
              defaultValue={institution.name}
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            {state?.errors?.name && (
              <p className="text-sm text-red-600">{state.errors.name[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={cnpjId} className="text-sm font-medium text-slate-700">
              CNPJ (14 dígitos)
            </label>
            <input
              id={cnpjId}
              name="cnpj"
              type="text"
              inputMode="numeric"
              defaultValue={institution.cnpj}
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            {state?.errors?.cnpj && (
              <p className="text-sm text-red-600">{state.errors.cnpj[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor={parentIdId}
              className="text-sm font-medium text-slate-700"
            >
              Instituição Superior
            </label>
            <select
              id={parentIdId}
              name="parentId"
              defaultValue={institution.parentId}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Nenhuma (raiz)</option>
              {availableParents.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-[#C9A227] px-4 py-2 text-sm font-semibold text-[#0B2545] transition hover:bg-[#C9A227]/90 disabled:opacity-60"
            >
              {pending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
