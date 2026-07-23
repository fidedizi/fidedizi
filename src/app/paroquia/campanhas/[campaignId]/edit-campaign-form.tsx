"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useActionToast } from "@/components/use-action-toast";
import { updateCampaign } from "@/app/actions/campaigns";

type CampaignData = {
  id: string;
  type: string;
  title: string;
  description: string;
  goalAmount: string;
  endsAt: string;
  pixKey: string;
  availableInChatbot: boolean;
};

export function EditCampaignForm({ campaign }: { campaign: CampaignData }) {
  const updateCampaignWithId = updateCampaign.bind(null, campaign.id);
  const [state, action, pending] = useActionState(
    updateCampaignWithId,
    undefined,
  );
  useActionToast(state);

  return (
    <form
      action={action}
      className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium text-slate-700">
          Título
        </label>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={campaign.title}
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {state?.errors?.title && (
          <p className="text-sm text-red-600">{state.errors.title[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1 lg:col-span-2">
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
          defaultValue={campaign.description}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1 lg:col-span-2">
        <label htmlFor="pixKey" className="text-sm font-medium text-slate-700">
          Chave Pix (opcional)
        </label>
        <input
          id="pixKey"
          name="pixKey"
          type="text"
          defaultValue={campaign.pixKey}
          placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <p className="text-xs text-slate-400">
          Usada nas vendas por Pix desta campanha. Se deixada em branco, será
          utilizada a integração de Pix padrão da paróquia.
        </p>
        {state?.errors?.pixKey && (
          <p className="text-sm text-red-600">{state.errors.pixKey[0]}</p>
        )}
      </div>

      {campaign.type === "PADRAO" && (
        <div className="flex flex-col gap-1">
          <label
            htmlFor="goalAmount"
            className="text-sm font-medium text-slate-700"
          >
            Meta (R$)
          </label>
          <input
            id="goalAmount"
            name="goalAmount"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={campaign.goalAmount}
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {state?.errors?.goalAmount && (
            <p className="text-sm text-red-600">
              {state.errors.goalAmount[0]}
            </p>
          )}
        </div>
      )}

      {campaign.type === "PADRAO" && (
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="availableInChatbot"
              value="true"
              defaultChecked={campaign.availableInChatbot}
            />
            Disponibilizar no chatbot do WhatsApp
          </label>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="endsAt" className="text-sm font-medium text-slate-700">
          Encerramento (opcional)
        </label>
        <input
          id="endsAt"
          name="endsAt"
          type="date"
          defaultValue={campaign.endsAt}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-md bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0B2545]/90 disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar alterações"}
        </button>
        <Link
          href="/paroquia/campanhas"
          className="text-sm text-slate-500 underline"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
