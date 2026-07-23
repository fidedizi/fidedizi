"use client";

import { useActionState } from "react";
import { useActionToast } from "@/components/use-action-toast";
import { updateInstitutionPixKey } from "@/app/actions/institution-profile";

export function InstitutionPixForm({ pixKey }: { pixKey: string }) {
  const [state, action, pending] = useActionState(
    updateInstitutionPixKey,
    undefined,
  );
  useActionToast(state);

  return (
    <form
      action={action}
      className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4"
    >
      <label htmlFor="pixKey" className="text-sm font-medium text-slate-700">
        Chave Pix da Instituição
      </label>
      <input
        id="pixKey"
        name="pixKey"
        type="text"
        defaultValue={pixKey}
        placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <p className="text-xs text-slate-400">
        Usada quando um fiel contribui com dízimo ou oferta pelo chatbot de
        WhatsApp (fora de uma campanha específica).
      </p>
      <div>
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
