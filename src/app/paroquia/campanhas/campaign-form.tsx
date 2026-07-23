"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useActionToast } from "@/components/use-action-toast";
import { createCampaign } from "@/app/actions/campaigns";
import { CAMPAIGN_TYPE_LABELS } from "@/lib/labels";

type FlavorDraft = { name: string; price: string; stockQuantity: string };

function emptyFlavor(): FlavorDraft {
  return { name: "", price: "", stockQuantity: "" };
}

export function CampaignForm() {
  const [state, action, pending] = useActionState(createCampaign, undefined);
  useActionToast(state);

  const [formKey, setFormKey] = useState(0);
  const [type, setType] = useState("PADRAO");
  const [flavors, setFlavors] = useState<FlavorDraft[]>([emptyFlavor()]);

  useEffect(() => {
    if (state?.message) {
      setFormKey((k) => k + 1);
      setType("PADRAO");
      setFlavors([emptyFlavor()]);
    }
  }, [state?.message]);

  function updateFlavor(index: number, field: keyof FlavorDraft, value: string) {
    setFlavors((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  return (
    <form
      key={formKey}
      action={action}
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="type" className="text-sm font-medium text-slate-700">
            Tipo de Campanha
          </label>
          <select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {Object.entries(CAMPAIGN_TYPE_LABELS).map(([value, label]) => (
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
          <label htmlFor="title" className="text-sm font-medium text-slate-700">
            Título
          </label>
          <input
            id="title"
            name="title"
            type="text"
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

        {type === "PADRAO" && (
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

        {type === "RIFA" && (
          <>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="raffleTotalNumbers"
                className="text-sm font-medium text-slate-700"
              >
                Quantidade de números
              </label>
              <input
                id="raffleTotalNumbers"
                name="raffleTotalNumbers"
                type="number"
                step="1"
                min="1"
                required
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              {state?.errors?.raffleTotalNumbers && (
                <p className="text-sm text-red-600">
                  {state.errors.raffleTotalNumbers[0]}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="raffleNumberPrice"
                className="text-sm font-medium text-slate-700"
              >
                Valor da rifa (R$)
              </label>
              <input
                id="raffleNumberPrice"
                name="raffleNumberPrice"
                type="number"
                step="0.01"
                min="0.01"
                required
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              {state?.errors?.raffleNumberPrice && (
                <p className="text-sm text-red-600">
                  {state.errors.raffleNumberPrice[0]}
                </p>
              )}
            </div>
          </>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="endsAt" className="text-sm font-medium text-slate-700">
            Encerramento (opcional)
          </label>
          <input
            id="endsAt"
            name="endsAt"
            type="date"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {type === "PIZZA" && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">
            Sabores de Pizza
          </span>
          <input type="hidden" name="flavorCount" value={flavors.length} />
          {flavors.map((flavor, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-4"
            >
              <input
                name={`flavorName_${index}`}
                type="text"
                placeholder="Sabor"
                value={flavor.name}
                onChange={(e) => updateFlavor(index, "name", e.target.value)}
                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
              <input
                name={`flavorPrice_${index}`}
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Valor (R$)"
                value={flavor.price}
                onChange={(e) => updateFlavor(index, "price", e.target.value)}
                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
              <input
                name={`flavorStock_${index}`}
                type="number"
                step="1"
                min="1"
                placeholder="Quantidade produzida"
                value={flavor.stockQuantity}
                onChange={(e) =>
                  updateFlavor(index, "stockQuantity", e.target.value)
                }
                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() =>
                  setFlavors((rows) => rows.filter((_, i) => i !== index))
                }
                disabled={flavors.length === 1}
                className="flex items-center justify-center gap-1.5 rounded-md border border-red-200 px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remover
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFlavors((rows) => [...rows, emptyFlavor()])}
            className="flex w-fit items-center gap-1.5 rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar sabor
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-md bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0B2545]/90 disabled:opacity-60"
        >
          {pending ? "Criando..." : "Criar campanha"}
        </button>
      </div>
    </form>
  );
}
