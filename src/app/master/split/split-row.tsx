"use client";

import { useActionState } from "react";
import { Save, Landmark, Building, Building2, Home } from "lucide-react";
import { upsertSplitConfig } from "@/app/actions/split";
import { INSTITUTION_TYPE_LABELS } from "@/lib/labels";
import { useActionToast } from "@/components/use-action-toast";
import type { InstitutionType } from "@/generated/prisma/client";

const TYPE_ICONS: Record<InstitutionType, typeof Landmark> = {
  ARQUIDIOCESE: Landmark,
  DIOCESE: Building,
  PAROQUIA: Building2,
  CAPELA: Home,
  COMUNIDADE: Home,
};

export function SplitRow({
  institutionId,
  name,
  type,
  initialRate,
}: {
  institutionId: string;
  name: string;
  type: InstitutionType;
  initialRate?: number;
}) {
  const [state, action, pending] = useActionState(upsertSplitConfig, undefined);
  useActionToast(state);
  const Icon = TYPE_ICONS[type];

  return (
    <form action={action} className="flex flex-wrap items-center gap-3 px-4 py-3">
      <input type="hidden" name="institutionId" value={institutionId} />
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5E9D6] text-[#0B2545]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">{name}</p>
        <p className="text-xs text-slate-400">{INSTITUTION_TYPE_LABELS[type]}</p>
      </div>
      <div className="flex items-center gap-1">
        <input
          type="number"
          name="commissionRate"
          step="0.01"
          min="0"
          max="100"
          defaultValue={initialRate}
          required
          className="w-16 rounded-md border border-slate-300 px-2 py-1.5 text-right text-sm"
        />
        <span className="text-sm text-slate-500">%</span>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
      >
        <Save className="h-3.5 w-3.5" />
        {pending ? "Salvando..." : "Salvar"}
      </button>
      {state?.errors?.commissionRate && (
        <span className="w-full text-xs text-red-600">
          {state.errors.commissionRate[0]}
        </span>
      )}
    </form>
  );
}
