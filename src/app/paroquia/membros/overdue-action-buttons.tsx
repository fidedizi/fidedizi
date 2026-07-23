"use client";

import { useActionState } from "react";
import { Heart, AlertTriangle } from "lucide-react";
import { useActionToast } from "@/components/use-action-toast";
import {
  identifyOverdueTithers,
  remindOverdueTithers,
} from "@/app/actions/members";

export function RemindOverdueButton() {
  const [state, action, pending] = useActionState(
    remindOverdueTithers,
    undefined,
  );
  useActionToast(state);

  return (
    <form action={action}>
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 rounded-md border border-[#C9A227] px-4 py-2 text-sm font-medium text-[#0B2545] transition hover:bg-[#C9A227]/10 disabled:opacity-60"
      >
        <Heart className="h-4 w-4 text-[#C9A227]" />
        {pending ? "Enviando..." : "Lembrar Atrasados"}
      </button>
    </form>
  );
}

export function IdentifyOverdueButton() {
  const [state, action, pending] = useActionState(
    identifyOverdueTithers,
    undefined,
  );
  useActionToast(state);

  return (
    <form action={action}>
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
      >
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        {pending ? "Identificando..." : "Identificar Atrasos"}
      </button>
    </form>
  );
}
