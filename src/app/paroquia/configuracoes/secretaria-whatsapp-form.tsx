"use client";

import { useActionState } from "react";
import { useActionToast } from "@/components/use-action-toast";
import { updateInstitutionSecretariaWhatsapp } from "@/app/actions/institution-profile";

export function SecretariaWhatsappForm({ phone }: { phone: string }) {
  const [state, action, pending] = useActionState(
    updateInstitutionSecretariaWhatsapp,
    undefined,
  );
  useActionToast(state);

  return (
    <form
      action={action}
      className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4"
    >
      <label htmlFor="phone" className="text-sm font-medium text-slate-700">
        Número WhatsApp Secretaria
      </label>
      <input
        id="phone"
        name="phone"
        type="text"
        defaultValue={phone}
        placeholder="(XX) 9XXXX-XXXX"
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <p className="text-xs text-slate-400">
        Este número é o que será apresentado no ChatBot do WhatsApp caso o
        fiel queira entrar em contato com a Secretaria.
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
