import Link from "next/link";
import { Printer } from "lucide-react";
import { requireParoquiaContext } from "@/lib/selected-institution";
import { requirePermission } from "@/lib/permissions";
import {
  PermissionModule,
  type ContributionType,
  type ContributionStatus,
} from "@/generated/prisma/client";
import { listRecentContributions } from "@/lib/queries/contributions";
import { listActiveCampaigns } from "@/lib/queries/campaigns";
import { listMemberSearchOptions } from "@/lib/queries/members";
import { formatBRL } from "@/lib/format";
import { formatWhatsApp } from "@/lib/whatsapp";
import { ResendReceiptButton } from "@/components/resend-receipt-button";
import { ConfirmPaymentButton } from "@/components/confirm-payment-button";
import { CashEntryForm } from "./cash-entry-form";

const TYPE_LABELS: Record<string, string> = {
  DIZIMO: "Dízimo",
  OFERTA: "Oferta",
  CAMPANHA: "Campanha",
  EVENTO: "Evento",
};

const METHOD_LABELS: Record<string, string> = {
  PIX: "PIX",
  CARTAO: "Cartão",
  ESPECIE: "Espécie",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-emerald-100 text-emerald-700",
};

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    status?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const { user, institution } = await requireParoquiaContext();
  await requirePermission(user, PermissionModule.FINANCEIRO);

  const params = await searchParams;
  const q = params.q?.trim() || undefined;
  const type =
    params.type && params.type in TYPE_LABELS
      ? (params.type as ContributionType)
      : undefined;
  const status =
    params.status && params.status in STATUS_LABELS
      ? (params.status as ContributionStatus)
      : undefined;
  const hasActiveFilters = Boolean(
    q || type || status || params.from || params.to,
  );

  const [contributions, campaigns, members] = await Promise.all([
    listRecentContributions(institution.id, {
      search: q,
      type,
      status,
      dateFrom: params.from,
      dateTo: params.to,
    }),
    listActiveCampaigns(institution.id),
    listMemberSearchOptions(institution.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          Gestão Financeira
        </h2>
        <p className="text-base font-semibold text-slate-600">{institution.name}</p>
      </div>

      <CashEntryForm
        campaignOptions={campaigns.map((c) => ({ id: c.id, title: c.title }))}
        memberOptions={members.map((m) => ({
          id: m.id,
          name: m.name,
          whatsapp: formatWhatsApp(m.whatsapp),
        }))}
      />

      <form
        action=""
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="q" className="text-xs font-medium text-slate-600">
            Nome ou WhatsApp
          </label>
          <input
            id="q"
            name="q"
            type="text"
            defaultValue={params.q ?? ""}
            placeholder="Buscar..."
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="type" className="text-xs font-medium text-slate-600">
            Tipo
          </label>
          <select
            id="type"
            name="type"
            defaultValue={params.type ?? ""}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-xs font-medium text-slate-600">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={params.status ?? ""}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="from" className="text-xs font-medium text-slate-600">
            De
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={params.from ?? ""}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="to" className="text-xs font-medium text-slate-600">
            Até
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={params.to ?? ""}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-md bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0B2545]/90"
          >
            Filtrar
          </button>
          {hasActiveFilters && (
            <Link
              href="/paroquia/financeiro"
              className="text-sm text-slate-500 underline"
            >
              Limpar filtros
            </Link>
          )}
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Data</th>
              <th className="px-4 py-2 font-medium">Tipo</th>
              <th className="px-4 py-2 font-medium">Campanha/Evento</th>
              <th className="px-4 py-2 font-medium">Método</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Valor Bruto</th>
              <th className="px-4 py-2 font-medium">Valor Líquido</th>
              <th className="px-4 py-2 font-medium">Nome do Fiel</th>
              <th className="px-4 py-2 font-medium">WhatsApp</th>
              <th className="px-4 py-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {contributions.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  Nenhum lançamento registrado ainda.
                </td>
              </tr>
            )}
            {contributions.map((c) => {
              const name = c.member?.name ?? c.buyerName;
              const whatsapp = c.member
                ? formatWhatsApp(c.member.whatsapp)
                : c.buyerPhone;
              const campaignOrEventName =
                c.campaign?.title ?? c.tickets[0]?.event.title ?? "—";

              return (
                <tr
                  key={c.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-2">
                    {c.createdAt.toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-2">{TYPE_LABELS[c.type]}</td>
                  <td className="px-4 py-2">{campaignOrEventName}</td>
                  <td className="px-4 py-2">{METHOD_LABELS[c.method]}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[c.status]}`}
                    >
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2">{formatBRL(c.grossAmount)}</td>
                  <td className="px-4 py-2">{formatBRL(c.netAmount)}</td>
                  <td className="px-4 py-2">{name ?? "—"}</td>
                  <td className="px-4 py-2">{whatsapp ?? "—"}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {c.status === "PENDING" && (
                        <ConfirmPaymentButton contributionId={c.id} />
                      )}
                      {whatsapp && <ResendReceiptButton contributionId={c.id} />}
                      <Link
                        href={`/paroquia/financeiro/recibo/${c.id}`}
                        title="Abrir recibo para imprimir ou salvar como PDF"
                        aria-label="Abrir recibo para imprimir ou salvar como PDF"
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-[#0B2545] hover:text-[#0B2545]"
                      >
                        <Printer className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
