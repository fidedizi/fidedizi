"use client";

import { Trash2 } from "lucide-react";
import { deleteMember } from "@/app/actions/members";

export function DeleteMemberButton({ memberId }: { memberId: string }) {
  const deleteMemberWithId = deleteMember.bind(null, memberId);

  return (
    <form
      action={deleteMemberWithId}
      onSubmit={(e) => {
        if (
          !confirm(
            "Tem certeza que deseja excluir este fiel? As contribuições já registradas não serão apagadas, apenas perderão o vínculo com o cadastro.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        aria-label="Excluir fiel"
        className="flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}
