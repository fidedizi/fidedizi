"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { resendAdminInvite } from "@/app/actions/admins";
import { useActionToast } from "@/components/use-action-toast";

export function ResendInviteButton({
  userId,
  dark = false,
}: {
  userId: string;
  dark?: boolean;
}) {
  const resendWithId = resendAdminInvite.bind(null, userId);
  const [state, action, pending] = useActionState(resendWithId, undefined);
  useActionToast(state);

  return (
    <form action={action}>
      <button
        type="submit"
        disabled={pending}
        className={
          dark
            ? "flex items-center gap-1.5 rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-60"
            : "flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
        }
      >
        <Send className="h-3.5 w-3.5" />
        {pending ? "Enviando..." : "Reenviar convite"}
      </button>
    </form>
  );
}
