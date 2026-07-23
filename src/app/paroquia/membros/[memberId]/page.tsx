import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone, Printer } from "lucide-react";
import { requireParoquiaContext } from "@/lib/selected-institution";
import { requirePermission } from "@/lib/permissions";
import { PermissionModule } from "@/generated/prisma/client";
import { getMemberById, listFlags, listMemberMessages } from "@/lib/queries/members";
import { listContributionsByMember } from "@/lib/queries/contributions";
import { formatWhatsApp, stripCountryCode } from "@/lib/whatsapp";
import { MESSAGE_TRIGGER_LABELS } from "@/lib/labels";
import { CONTRIBUTION_TYPE_LABELS } from "@/lib/receipt";
import { OVERDUE_FLAG_NAME } from "@/lib/overdue";
import { formatBRL } from "@/lib/format";
import { ResendReceiptButton } from "@/components/resend-receipt-button";
import { EditMemberModal } from "../member-modal";

const CONTRIBUTION_METHOD_LABELS: Record<string, string> = {
  PIX: "PIX",
  CARTAO: "Cartão",
  ESPECIE: "Espécie",
};

export default async function PerfilMembroPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { user, institution } = await requireParoquiaContext();
  await requirePermission(user, PermissionModule.MEMBROS);
  const { memberId } = await params;

  const [member, flags, messages, contributions] = await Promise.all([
    getMemberById(memberId, institution.id),
    listFlags(institution.id),
    listMemberMessages(memberId),
    listContributionsByMember(memberId),
  ]);

  if (!member) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0B2545] text-base font-semibold text-white">
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-800">
                {member.name}
              </h2>
              {member.isActiveTither && (
                <span className="rounded-full bg-[#C9A227] px-2 py-0.5 text-xs font-semibold text-[#0B2545]">
                  Dizimista
                </span>
              )}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {formatWhatsApp(member.whatsapp)}
              </span>
              {member.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> {member.email}
                </span>
              )}
            </div>
            {member.flags.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {member.flags.map((mf) => (
                  <span
                    key={mf.flagId}
                    className={`rounded-full border px-2 py-0.5 text-xs ${
                      mf.flag.name === "Em atraso"
                        ? "border-red-300 text-red-600"
                        : "border-slate-300 text-slate-600"
                    }`}
                  >
                    {mf.flag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <EditMemberModal
          member={{
            id: member.id,
            name: member.name,
            whatsapp: stripCountryCode(member.whatsapp),
            email: member.email ?? "",
            birthDate: member.birthDate
              ? member.birthDate.toISOString().slice(0, 10)
              : "",
            address: member.address ?? "",
            donationMethod: member.donationMethod,
            isActiveTither: member.isActiveTither,
            notes: member.notes ?? "",
            flagIds: member.flags.map((mf) => mf.flagId),
          }}
          flagOptions={flags
            .filter((flag) => flag.name !== OVERDUE_FLAG_NAME)
            .map((flag) => ({ id: flag.id, name: flag.name }))}
        />
      </div>

      <h3 className="text-lg font-semibold text-slate-800">
        Histórico de Contribuições
      </h3>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Data</th>
              <th className="px-4 py-2 font-medium">Tipo</th>
              <th className="px-4 py-2 font-medium">Método</th>
              <th className="px-4 py-2 font-medium">Valor Bruto</th>
              <th className="px-4 py-2 font-medium">Valor Líquido</th>
              <th className="px-4 py-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {contributions.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  Nenhuma contribuição registrada ainda.
                </td>
              </tr>
            )}
            {contributions.map((contribution) => (
              <tr
                key={contribution.id}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="px-4 py-2">
                  {contribution.createdAt.toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-2">
                  {contribution.campaign?.title ??
                    CONTRIBUTION_TYPE_LABELS[contribution.type]}
                </td>
                <td className="px-4 py-2">
                  {CONTRIBUTION_METHOD_LABELS[contribution.method]}
                </td>
                <td className="px-4 py-2">
                  {formatBRL(contribution.grossAmount)}
                </td>
                <td className="px-4 py-2">
                  {formatBRL(contribution.netAmount)}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <ResendReceiptButton contributionId={contribution.id} />
                    <Link
                      href={`/paroquia/financeiro/recibo/${contribution.id}`}
                      title="Abrir recibo para imprimir ou salvar como PDF"
                      aria-label="Abrir recibo para imprimir ou salvar como PDF"
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-[#0B2545] hover:text-[#0B2545]"
                    >
                      <Printer className="h-4 w-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-lg font-semibold text-slate-800">
        Histórico de Mensagens
      </h3>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Tipo de Mensagem</th>
              <th className="px-4 py-2 font-medium">Data/Hora do Envio</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {messages.length === 0 && (
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  Nenhuma mensagem registrada ainda.
                </td>
              </tr>
            )}
            {messages.map((message) => (
              <tr
                key={message.id}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="px-4 py-2">
                  {MESSAGE_TRIGGER_LABELS[message.trigger]}
                </td>
                <td className="px-4 py-2">
                  {message.sentAt.toLocaleString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
