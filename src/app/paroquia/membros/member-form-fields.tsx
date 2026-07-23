"use client";

import Link from "next/link";
import { DONATION_METHOD_LABELS } from "@/lib/labels";
import type { MemberFormState } from "@/lib/definitions";

type FlagOption = { id: string; name: string };

export type MemberDefaults = {
  name: string;
  whatsapp: string;
  email: string;
  birthDate: string;
  address: string;
  donationMethod: string;
  isActiveTither: boolean;
  notes: string;
  flagIds: string[];
};

export function MemberFormFields({
  state,
  defaults,
  flagOptions,
  pending,
  onCancel,
  submitLabel,
}: {
  state: MemberFormState;
  defaults?: MemberDefaults;
  flagOptions: FlagOption[];
  pending: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Nome completo *
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

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
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

        <div className="flex flex-col gap-1">
          <label
            htmlFor="whatsapp"
            className="text-sm font-medium text-slate-700"
          >
            Telefone
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            type="text"
            inputMode="numeric"
            placeholder="11999999999"
            defaultValue={defaults?.whatsapp}
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {state?.errors?.whatsapp && (
            <p className="text-sm text-red-600">{state.errors.whatsapp[0]}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="birthDate"
            className="text-sm font-medium text-slate-700"
          >
            Data de nascimento
          </label>
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            defaultValue={defaults?.birthDate}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="donationMethod"
            className="text-sm font-medium text-slate-700"
          >
            Método de doação
          </label>
          <select
            id="donationMethod"
            name="donationMethod"
            defaultValue={defaults?.donationMethod ?? "AVULSO"}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {Object.entries(DONATION_METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="address" className="text-sm font-medium text-slate-700">
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

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">
            Etiquetas
          </span>
          <Link
            href="/paroquia/configuracoes"
            className="text-xs text-[#0B2545] underline"
          >
            gerenciar
          </Link>
        </div>
        {flagOptions.length === 0 ? (
          <p className="text-sm text-slate-400">
            Nenhuma etiqueta cadastrada ainda. Adicione em{" "}
            <Link
              href="/paroquia/configuracoes"
              className="text-[#0B2545] underline"
            >
              Configurações
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {flagOptions.map((flag) => (
              <label
                key={flag.id}
                className="cursor-pointer rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition has-[:checked]:border-[#0B2545] has-[:checked]:bg-[#0B2545] has-[:checked]:text-white"
              >
                <input
                  type="checkbox"
                  name="flagIds"
                  value={flag.id}
                  defaultChecked={defaults?.flagIds.includes(flag.id)}
                  className="hidden"
                />
                {flag.name}
              </label>
            ))}
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="isActiveTither"
          value="true"
          defaultChecked={defaults?.isActiveTither}
        />
        Dizimista ativo
      </label>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-slate-700">
          Observações
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaults?.notes}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
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
