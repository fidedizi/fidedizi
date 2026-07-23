"use client";

import { useActionState, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Modal } from "@/components/modal";
import { useActionToast, useCloseOnSuccess } from "@/components/use-action-toast";
import { createEvent, updateEvent } from "@/app/actions/events";
import { EVENT_STATUS_LABELS } from "@/lib/labels";
import type { EventFormState } from "@/lib/definitions";

type EventDefaults = {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  adultPrice: string;
  childPrice: string;
  capacity: string;
  status: string;
  availableInChatbot?: boolean;
};

function EventFormFields({
  state,
  defaults,
  pending,
  onCancel,
  submitLabel,
}: {
  state: EventFormState;
  defaults?: EventDefaults;
  pending: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium text-slate-700">
          Título *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={defaults?.title}
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {state?.errors?.title && (
          <p className="text-sm text-red-600">{state.errors.title[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="description"
          className="text-sm font-medium text-slate-700"
        >
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={defaults?.description}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="date" className="text-sm font-medium text-slate-700">
            Data *
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={defaults?.date}
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {state?.errors?.date && (
            <p className="text-sm text-red-600">{state.errors.date[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="time" className="text-sm font-medium text-slate-700">
            Horário
          </label>
          <input
            id="time"
            name="time"
            type="time"
            defaultValue={defaults?.time}
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {state?.errors?.time && (
            <p className="text-sm text-red-600">{state.errors.time[0]}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="location" className="text-sm font-medium text-slate-700">
          Local
        </label>
        <input
          id="location"
          name="location"
          type="text"
          defaultValue={defaults?.location}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="adultPrice"
            className="text-sm font-medium text-slate-700"
          >
            Preço Adulto (R$) *
          </label>
          <input
            id="adultPrice"
            name="adultPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaults?.adultPrice}
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {state?.errors?.adultPrice && (
            <p className="text-sm text-red-600">
              {state.errors.adultPrice[0]}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="childPrice"
            className="text-sm font-medium text-slate-700"
          >
            Preço Criança (R$) *
          </label>
          <input
            id="childPrice"
            name="childPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaults?.childPrice}
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {state?.errors?.childPrice && (
            <p className="text-sm text-red-600">
              {state.errors.childPrice[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="capacity"
            className="text-sm font-medium text-slate-700"
          >
            Capacidade Máxima
          </label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            step="1"
            min="1"
            defaultValue={defaults?.capacity}
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {state?.errors?.capacity && (
            <p className="text-sm text-red-600">{state.errors.capacity[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={defaults?.status ?? "ATIVO"}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {Object.entries(EVENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="availableInChatbot"
            value="true"
            defaultChecked={defaults?.availableInChatbot}
          />
          Disponibilizar no chatbot do WhatsApp
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[#C9A227] px-4 py-2 text-sm font-semibold text-[#0B2545] transition hover:bg-[#C9A227]/90 disabled:opacity-60"
        >
          {pending ? "Salvando..." : submitLabel}
        </button>
      </div>
    </div>
  );
}

export function NewEventModal() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createEvent, undefined);
  useActionToast(state);
  useCloseOnSuccess(state, () => setOpen(false));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md bg-[#C9A227] px-4 py-2 text-sm font-semibold text-[#0B2545] transition hover:bg-[#C9A227]/90"
      >
        <Plus className="h-4 w-4" /> Novo Evento
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Novo Evento">
        <form action={action}>
          <EventFormFields
            state={state}
            pending={pending}
            onCancel={() => setOpen(false)}
            submitLabel="Criar Evento"
          />
        </form>
      </Modal>
    </>
  );
}

export function EditEventModal({
  event,
}: {
  event: { id: string } & EventDefaults;
}) {
  const [open, setOpen] = useState(false);
  const updateEventWithId = updateEvent.bind(null, event.id);
  const [state, action, pending] = useActionState(updateEventWithId, undefined);
  useActionToast(state);
  useCloseOnSuccess(state, () => setOpen(false));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Editar evento"
        className="text-slate-500 hover:text-slate-700"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Editar Evento">
        <form action={action}>
          <EventFormFields
            state={state}
            defaults={event}
            pending={pending}
            onCancel={() => setOpen(false)}
            submitLabel="Salvar"
          />
        </form>
      </Modal>
    </>
  );
}
