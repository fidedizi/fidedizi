"use client";

import { useActionState, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Modal } from "@/components/modal";
import { useActionToast, useCloseOnSuccess } from "@/components/use-action-toast";
import { createMember, updateMember } from "@/app/actions/members";
import { MemberFormFields, type MemberDefaults } from "./member-form-fields";

type FlagOption = { id: string; name: string };

export function NewMemberModal({ flagOptions }: { flagOptions: FlagOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createMember, undefined);
  useActionToast(state);
  useCloseOnSuccess(state, () => setOpen(false));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md bg-[#C9A227] px-4 py-2 text-sm font-semibold text-[#0B2545] transition hover:bg-[#C9A227]/90"
      >
        <Plus className="h-4 w-4" /> Novo Membro
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Novo Membro">
        <form action={action}>
          <MemberFormFields
            state={state}
            flagOptions={flagOptions}
            pending={pending}
            onCancel={() => setOpen(false)}
            submitLabel="Cadastrar"
          />
        </form>
      </Modal>
    </>
  );
}

export function EditMemberModal({
  member,
  flagOptions,
}: {
  member: { id: string } & MemberDefaults;
  flagOptions: FlagOption[];
}) {
  const [open, setOpen] = useState(false);
  const updateMemberWithId = updateMember.bind(null, member.id);
  const [state, action, pending] = useActionState(
    updateMemberWithId,
    undefined,
  );
  useActionToast(state);
  useCloseOnSuccess(state, () => setOpen(false));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Editar fiel"
        className="flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition hover:text-[#0B2545]"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Editar Membro">
        <form action={action}>
          <MemberFormFields
            state={state}
            defaults={member}
            flagOptions={flagOptions}
            pending={pending}
            onCancel={() => setOpen(false)}
            submitLabel="Salvar"
          />
        </form>
      </Modal>
    </>
  );
}
