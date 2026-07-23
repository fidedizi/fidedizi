"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useActionToast } from "@/components/use-action-toast";
import { confirmContributionPayment } from "@/app/actions/contributions";

export function ConfirmPaymentButton({
  contributionId,
}: {
  contributionId: string;
}) {
  const [state, action, pending] = useActionState(
    confirmContributionPayment,
    undefined,
  );
  useActionToast(state);

  return (
    <form
      action={action}
      className="inline-flex"
      title="Confirmar pagamento (libera ingressos pendentes, se houver)"
    >
      <input type="hidden" name="contributionId" value={contributionId} />
      <button
        type="submit"
        disabled={pending}
        aria-label="Confirmar pagamento"
        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-emerald-600 hover:text-emerald-600 disabled:opacity-50"
      >
        <CheckCircle2 className="h-4 w-4" />
      </button>
    </form>
  );
}
