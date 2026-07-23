"use client";

import { useActionState, useEffect, useState } from "react";
import { useActionToast } from "@/components/use-action-toast";
import { createCashEntry } from "@/app/actions/contributions";

const TYPE_LABELS: Record<string, string> = {
  DIZIMO: "Dízimo",
  OFERTA: "Oferta",
  CAMPANHA: "Campanha",
};

type CampaignOption = {
  id: string;
  title: string;
};

type MemberOption = {
  id: string;
  name: string;
  whatsapp: string;
};

function MemberSearchField({ memberOptions }: { memberOptions: MemberOption[] }) {
  const [query, setQuery] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [open, setOpen] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();
  const queryDigits = query.replace(/\D/g, "");
  const filtered = normalizedQuery
    ? memberOptions
        .filter((m) => {
          const nameMatch = m.name.toLowerCase().includes(normalizedQuery);
          const phoneMatch =
            queryDigits.length >= 3 &&
            m.whatsapp.replace(/\D/g, "").includes(queryDigits);
          return nameMatch || phoneMatch;
        })
        .slice(0, 8)
    : [];

  return (
    <div className="relative flex flex-col gap-1">
      <label htmlFor="memberQuery" className="text-sm font-medium text-slate-700">
        Nome do Fiel
      </label>
      <input
        id="memberQuery"
        type="text"
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedMemberId("");
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Buscar por nome ou WhatsApp"
        className="w-56 rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <input type="hidden" name="memberId" value={selectedMemberId} />

      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 z-10 mt-1 w-64 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg max-h-56">
          {filtered.map((m) => (
            <button
              key={m.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setQuery(m.name);
                setSelectedMemberId(m.id);
                setOpen(false);
              }}
              className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-slate-100"
            >
              <span className="font-medium text-slate-800">{m.name}</span>
              <span className="text-xs text-slate-500">{m.whatsapp}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CashEntryForm({
  campaignOptions,
  memberOptions,
}: {
  campaignOptions: CampaignOption[];
  memberOptions: MemberOption[];
}) {
  const [state, action, pending] = useActionState(createCashEntry, undefined);
  useActionToast(state);
  const [formKey, setFormKey] = useState(0);
  const [type, setType] = useState("DIZIMO");

  useEffect(() => {
    if (state?.message) {
      setFormKey((k) => k + 1);
    }
  }, [state?.message]);

  return (
    <form
      key={formKey}
      action={action}
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end sm:gap-3"
    >
      <MemberSearchField memberOptions={memberOptions} />

      <div className="flex flex-col gap-1">
        <label htmlFor="type" className="text-sm font-medium text-slate-700">
          Tipo
        </label>
        <select
          id="type"
          name="type"
          required
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="campaignId"
          className="text-sm font-medium text-slate-700"
        >
          Campanha (se aplicável)
        </label>
        <select
          id="campaignId"
          name="campaignId"
          onChange={(e) => {
            if (e.target.value) setType("CAMPANHA");
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Nenhuma</option>
          {campaignOptions.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="amount"
          className="text-sm font-medium text-slate-700"
        >
          Valor (R$)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {state?.errors?.amount && (
          <p className="text-sm text-red-600">{state.errors.amount[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0B2545]/90 disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Lançar em espécie"}
      </button>
    </form>
  );
}
