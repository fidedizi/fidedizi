"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/modal";
import { useActionToast, useCloseOnSuccess } from "@/components/use-action-toast";
import { createMasterUser } from "@/app/actions/master-users";
import {
  INSTITUTION_TYPE_LABELS,
  PERMISSION_MODULE_LABELS,
  USER_SCOPE_LABELS,
} from "@/lib/labels";

type InstitutionOption = { id: string; name: string; type: string };

const SCOPE_INSTITUTION_TYPES: Record<string, string[]> = {
  DIOCESE: ["ARQUIDIOCESE", "DIOCESE"],
  PAROQUIA: ["PAROQUIA", "CAPELA", "COMUNIDADE"],
};

const MODULES = Object.entries(PERMISSION_MODULE_LABELS);

export function NewUserModal({
  institutionOptions,
}: {
  institutionOptions: InstitutionOption[];
}) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState("PAROQUIA");
  const [isOwner, setIsOwner] = useState(false);
  const [state, action, pending] = useActionState(createMasterUser, undefined);
  useActionToast(state);
  useCloseOnSuccess(state, () => setOpen(false));

  const filteredInstitutions = useMemo(() => {
    const allowedTypes = SCOPE_INSTITUTION_TYPES[scope];
    if (!allowedTypes) return [];
    return institutionOptions.filter((institution) =>
      allowedTypes.includes(institution.type),
    );
  }, [institutionOptions, scope]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md bg-[#C9A227] px-4 py-2 text-sm font-semibold text-[#0B2545] transition hover:bg-[#C9A227]/90"
      >
        <Plus className="h-4 w-4" /> Novo Usuário
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Novo Usuário">
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium text-slate-700">
              Nome completo *
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
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              E-mail *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            {state?.errors?.email && (
              <p className="text-sm text-red-600">{state.errors.email[0]}</p>
            )}
            <p className="text-xs text-slate-400">
              O usuário receberá um e-mail com um link para cadastrar a
              própria senha.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="scope" className="text-sm font-medium text-slate-700">
              Tipo de acesso *
            </label>
            <select
              id="scope"
              name="scope"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {Object.entries(USER_SCOPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {state?.errors?.scope && (
              <p className="text-sm text-red-600">{state.errors.scope[0]}</p>
            )}
          </div>

          {scope !== "MASTER" && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="institutionId"
                className="text-sm font-medium text-slate-700"
              >
                Paróquia/Capela/Comunidade *
              </label>
              <select
                id="institutionId"
                name="institutionId"
                required
                defaultValue=""
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {filteredInstitutions.map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.name} ({INSTITUTION_TYPE_LABELS[institution.type]})
                  </option>
                ))}
              </select>
              {state?.errors?.institutionId && (
                <p className="text-sm text-red-600">
                  {state.errors.institutionId[0]}
                </p>
              )}
            </div>
          )}

          {scope === "PAROQUIA" && (
            <>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="isOwner"
                  checked={isOwner}
                  onChange={(e) => setIsOwner(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Proprietário (pároco) — acesso total, sem restrições
              </label>

              {!isOwner && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    Níveis de Acesso
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {MODULES.map(([value, label]) => (
                      <label
                        key={value}
                        className="cursor-pointer rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition has-[:checked]:border-[#0B2545] has-[:checked]:bg-[#0B2545] has-[:checked]:text-white"
                      >
                        <input
                          type="checkbox"
                          name="modules"
                          value={value}
                          className="hidden"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

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
              {pending ? "Cadastrando..." : "Cadastrar"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
