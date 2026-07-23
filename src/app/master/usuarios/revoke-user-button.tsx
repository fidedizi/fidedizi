"use client";

import { Lock } from "lucide-react";
import { revokeMasterUser } from "@/app/actions/master-users";

export function RevokeUserButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const revokeWithId = revokeMasterUser.bind(null, userId);

  return (
    <form
      action={revokeWithId}
      onSubmit={(e) => {
        if (
          !confirm(
            `Tem certeza que deseja revogar o acesso de "${userName}"? Ele(a) não poderá mais entrar no sistema.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
      >
        <Lock className="h-3.5 w-3.5" /> Revogar
      </button>
    </form>
  );
}
