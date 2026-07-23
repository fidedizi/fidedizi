"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { useActionToast } from "@/components/use-action-toast";
import { deleteEvent } from "@/app/actions/events";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const deleteEventWithId = deleteEvent.bind(null, eventId);
  const [state, action] = useActionState(deleteEventWithId, undefined);
  useActionToast(state);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Tem certeza que deseja excluir este evento?")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        aria-label="Excluir evento"
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}
