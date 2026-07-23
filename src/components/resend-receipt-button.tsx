"use client";

import { useActionState } from "react";
import { MessageCircle } from "lucide-react";
import { useActionToast } from "@/components/use-action-toast";
import { resendReceipt } from "@/app/actions/contributions";

export function ResendReceiptButton({
  contributionId,
}: {
  contributionId: string;
}) {
  const [state, action, pending] = useActionState(resendReceipt, undefined);
  useActionToast(state);

  return (
    <form action={action} className="inline-flex" title="Reenviar recibo pelo WhatsApp">
      <input type="hidden" name="contributionId" value={contributionId} />
      <button
        type="submit"
        disabled={pending}
        aria-label="Reenviar recibo pelo WhatsApp"
        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-[#0B2545] hover:text-[#0B2545] disabled:opacity-50"
      >
        <MessageCircle className="h-4 w-4" />
      </button>
    </form>
  );
}
