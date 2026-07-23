"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { resendMasterUserInvite } from "@/app/actions/master-users";
import { useActionToast } from "@/components/use-action-toast";

export function ResendInviteButton({ userId }: { userId: string }) {
  const resendWithId = resendMasterUserInvite.bind(null, userId);
  const [state, action, pending] = useActionState(resendWithId, undefined);
  useActionToast(state);

  return (
    <form action={action}>
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
      >
        <Send className="h-3.5 w-3.5" />
        {pending ? "Enviando..." : "Reenviar convite"}
      </button>
    </form>
  );
}
