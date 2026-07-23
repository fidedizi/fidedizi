import Link from "next/link";
import { Calendar, MapPin, Ticket, Users, QrCode } from "lucide-react";
import { formatBRL, formatDateForInput, formatTimeForInput } from "@/lib/format";
import { EVENT_STATUS_LABELS } from "@/lib/labels";
import { EditEventModal } from "./event-form-modal";
import { SellTicketsModal } from "./sell-tickets-modal";
import { DeleteEventButton } from "./delete-event-button";

const STATUS_BADGE_CLASSES: Record<string, string> = {
  ATIVO: "bg-emerald-100 text-emerald-700",
  INATIVO: "bg-slate-100 text-slate-600",
  ENCERRADO: "bg-slate-200 text-slate-500",
};

type MemberOption = {
  id: string;
  name: string;
  whatsapp: string;
  email: string;
};

type EventCardProps = {
  event: {
    id: string;
    title: string;
    description: string | null;
    startsAt: Date;
    location: string | null;
    adultPrice: { toString(): string };
    childPrice: { toString(): string };
    capacity: number;
    status: string;
    availableInChatbot: boolean;
    sold: number;
    revenue: number;
  };
  memberOptions: MemberOption[];
};

export function EventCard({ event, memberOptions }: EventCardProps) {
  const adultPrice = Number(event.adultPrice.toString());
  const childPrice = Number(event.childPrice.toString());

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="truncate text-base font-semibold text-slate-800">
          {event.title}
        </h3>
        <span
          className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[event.status]}`}
        >
          {EVENT_STATUS_LABELS[event.status]}
        </span>
      </div>

      {event.description && (
        <p className="text-sm text-slate-500">{event.description}</p>
      )}

      <div className="flex flex-col gap-1 text-sm text-slate-600">
        <p className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          {event.startsAt.toLocaleDateString("pt-BR")} ·{" "}
          {event.startsAt.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          h
        </p>
        {event.location && (
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400" />
            {event.location}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md bg-slate-100 px-3 py-2">
          <p className="text-xs uppercase text-slate-500">Adulto</p>
          <p className="text-sm font-semibold text-slate-800">
            {formatBRL(adultPrice)}
          </p>
        </div>
        <div className="rounded-md bg-amber-50 px-3 py-2">
          <p className="text-xs uppercase text-slate-500">Criança</p>
          <p className="text-sm font-semibold text-slate-800">
            {formatBRL(childPrice)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-slate-600">
        <span className="flex items-center gap-1.5">
          <Ticket className="h-4 w-4 text-slate-400" />
          {event.sold} vendidos
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-slate-400" />
          {formatBRL(event.revenue)}
        </span>
        <span className="ml-auto text-slate-500">
          {event.sold}/{event.capacity}
        </span>
      </div>

      <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
        <SellTicketsModal
          event={{ id: event.id, adultPrice, childPrice }}
          memberOptions={memberOptions}
        />
        <Link
          href="/paroquia/eventos/validar"
          className="flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <QrCode className="h-4 w-4" /> Scanner
        </Link>
        <EditEventModal
          event={{
            id: event.id,
            title: event.title,
            description: event.description ?? "",
            date: formatDateForInput(event.startsAt),
            time: formatTimeForInput(event.startsAt),
            location: event.location ?? "",
            adultPrice: adultPrice.toString(),
            childPrice: childPrice.toString(),
            capacity: event.capacity.toString(),
            status: event.status,
            availableInChatbot: event.availableInChatbot,
          }}
        />
        <DeleteEventButton eventId={event.id} />
      </div>
    </div>
  );
}
