"use client";

import { useActionState, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Modal } from "@/components/modal";
import { useActionToast, useCloseOnSuccess } from "@/components/use-action-toast";
import { createSubUnit, updateSubUnit } from "@/app/actions/sub-units";
import { INSTITUTION_STATUS_LABELS } from "@/lib/labels";
import type { SubUnitFormState } from "@/lib/definitions";

type SubUnitDefaults = {
  name: string;
  cnpj: string;
  type: string;
  address: string;
  city: string;
  state: string;
  contactName: string;
  phone: string;
  email: string;
  status: string;
};

function SubUnitFormFields({
  state,
  defaults,
  pending,
  onCancel,
  submitLabel,
}: {
  state: SubUnitFormState;
  defaults?: SubUnitDefaults;
  pending: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Nome *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={defaults?.name}
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {state?.errors?.name && (
          <p className="text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="cnpj" className="text-sm font-medium text-slate-700">
          CNPJ *
        </label>
        <input
          id="cnpj"
          name="cnpj"
          type="text"
          defaultValue={defaults?.cnpj}
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {state?.errors?.cnpj && (
          <p className="text-sm text-red-600">{state.errors.cnpj[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="type" className="text-sm font-medium text-slate-700">
          Tipo
        </label>
        <select
          id="type"
          name="type"
          defaultValue={defaults?.type ?? "CAPELA"}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="CAPELA">Capela</option>
          <option value="COMUNIDADE">Comunidade</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="address"
          className="text-sm font-medium text-slate-700"
        >
          Endereço
        </label>
        <input
          id="address"
          name="address"
          type="text"
          defaultValue={defaults?.address}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="city" className="text-sm font-medium text-slate-700">
            Cidade
          </label>
          <input
            id="city"
            name="city"
            type="text"
            defaultValue={defaults?.city}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="state"
            className="text-sm font-medium text-slate-700"
          >
            Estado
          </label>
          <input
            id="state"
            name="state"
            type="text"
            defaultValue={defaults?.state}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="contactName"
          className="text-sm font-medium text-slate-700"
        >
          Responsável
        </label>
        <input
          id="contactName"
          name="contactName"
          type="text"
          defaultValue={defaults?.contactName}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="phone"
            className="text-sm font-medium text-slate-700"
          >
            Telefone
          </label>
          <input
            id="phone"
            name="phone"
            type="text"
            defaultValue={defaults?.phone}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="email"
            className="text-sm font-medium text-slate-700"
          >
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={defaults?.email}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {state?.errors?.email && (
            <p className="text-sm text-red-600">{state.errors.email[0]}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="status" className="text-sm font-medium text-slate-700">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={defaults?.status ?? "ACTIVE"}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {Object.entries(INSTITUTION_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[#C9A227] px-4 py-2 text-sm font-semibold text-[#0B2545] transition hover:bg-[#C9A227]/90 disabled:opacity-60"
        >
          {pending ? "Salvando..." : submitLabel}
        </button>
      </div>
    </div>
  );
}

export function NewSubUnitModal() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createSubUnit, undefined);
  useActionToast(state);
  useCloseOnSuccess(state, () => setOpen(false));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md bg-[#C9A227] px-4 py-2 text-sm font-semibold text-[#0B2545] transition hover:bg-[#C9A227]/90"
      >
        <Plus className="h-4 w-4" /> Nova Comunidade
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nova Comunidade">
        <form action={action}>
          <SubUnitFormFields
            state={state}
            pending={pending}
            onCancel={() => setOpen(false)}
            submitLabel="Criar"
          />
        </form>
      </Modal>
    </>
  );
}

export function EditSubUnitModal({
  subUnit,
}: {
  subUnit: { id: string } & SubUnitDefaults;
}) {
  const [open, setOpen] = useState(false);
  const updateSubUnitWithId = updateSubUnit.bind(null, subUnit.id);
  const [state, action, pending] = useActionState(
    updateSubUnitWithId,
    undefined,
  );
  useActionToast(state);
  useCloseOnSuccess(state, () => setOpen(false));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Editar comunidade"
        className="text-slate-500 hover:text-slate-700"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Editar Comunidade"
      >
        <form action={action}>
          <SubUnitFormFields
            state={state}
            defaults={subUnit}
            pending={pending}
            onCancel={() => setOpen(false)}
            submitLabel="Salvar"
          />
        </form>
      </Modal>
    </>
  );
}
