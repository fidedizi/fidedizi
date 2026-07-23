import { notFound } from "next/navigation";
import { requireParoquiaContext } from "@/lib/selected-institution";
import { requirePermission } from "@/lib/permissions";
import { PermissionModule } from "@/generated/prisma/client";
import { getContributionForReceipt } from "@/lib/queries/contributions";
import { formatBRL } from "@/lib/format";
import { formatWhatsApp } from "@/lib/whatsapp";
import { CONTRIBUTION_TYPE_LABELS } from "@/lib/receipt";
import { CONTRIBUTION_METHOD_LABELS } from "@/lib/labels";
import { PrintButton } from "./print-button";

export default async function ReciboContribuicaoPage({
  params,
}: {
  params: Promise<{ contributionId: string }>;
}) {
  const { user, institution } = await requireParoquiaContext();
  await requirePermission(user, PermissionModule.FINANCEIRO);
  const { contributionId } = await params;

  const contribution = await getContributionForReceipt(
    contributionId,
    institution.id,
  );

  if (!contribution) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between print:hidden">
        <h2 className="text-xl font-semibold text-slate-800">
          Recibo de Contribuição
        </h2>
        <PrintButton />
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6">
        <div className="text-center">
          <p className="text-lg font-bold text-[#0B2545]">
            {contribution.institution.name}
          </p>
          <p className="text-sm text-slate-500">Recibo de Contribuição</p>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Fiel</span>
            <span className="font-medium text-slate-800">
              {contribution.member?.name ?? contribution.buyerName ?? "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">WhatsApp</span>
            <span className="font-medium text-slate-800">
              {contribution.member
                ? formatWhatsApp(contribution.member.whatsapp)
                : contribution.buyerPhone ?? "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Data</span>
            <span className="font-medium text-slate-800">
              {contribution.createdAt.toLocaleDateString("pt-BR")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tipo</span>
            <span className="font-medium text-slate-800">
              {CONTRIBUTION_TYPE_LABELS[contribution.type]}
            </span>
          </div>
          {contribution.campaign && (
            <div className="flex justify-between">
              <span className="text-slate-500">Campanha</span>
              <span className="font-medium text-slate-800">
                {contribution.campaign.title}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Método</span>
            <span className="font-medium text-slate-800">
              {CONTRIBUTION_METHOD_LABELS[contribution.method]}
            </span>
          </div>
        </div>

        <div className="flex justify-between border-t border-slate-200 pt-4">
          <span className="text-sm font-semibold text-slate-700">
            Valor
          </span>
          <span className="text-xl font-bold text-[#0B2545]">
            {formatBRL(contribution.grossAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}
