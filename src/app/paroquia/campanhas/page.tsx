import Link from "next/link";
import { requireParoquiaContext } from "@/lib/selected-institution";
import { requirePermission } from "@/lib/permissions";
import { PermissionModule } from "@/generated/prisma/client";
import {
  listCampaignsWithProgress,
  getPizzaOrdersReport,
  getRaffleOrdersReport,
  getCampaignContributionsReport,
} from "@/lib/queries/campaigns";
import { listMemberSearchOptions } from "@/lib/queries/members";
import { formatBRL } from "@/lib/format";
import { CAMPAIGN_TYPE_LABELS } from "@/lib/labels";
import { CampaignForm } from "./campaign-form";
import { DeleteCampaignButton } from "./delete-campaign-button";
import { RafflePanel } from "./raffle-panel";
import { PizzaPanel } from "./pizza-panel";
import { StandardCampaignReportModal } from "./standard-campaign-report";

export default async function CampanhasPage() {
  const { user, institution } = await requireParoquiaContext();
  await requirePermission(user, PermissionModule.CAMPANHAS);

  const [campaigns, members] = await Promise.all([
    listCampaignsWithProgress(institution.id),
    listMemberSearchOptions(institution.id),
  ]);

  const pizzaOrdersEntries = await Promise.all(
    campaigns
      .filter((c) => c.type === "PIZZA")
      .map(
        async (c) => [c.id, await getPizzaOrdersReport(c.id)] as const,
      ),
  );
  const pizzaOrdersByCampaign = new Map(pizzaOrdersEntries);

  const raffleOrdersEntries = await Promise.all(
    campaigns
      .filter((c) => c.type === "RIFA")
      .map(
        async (c) => [c.id, await getRaffleOrdersReport(c.id)] as const,
      ),
  );
  const raffleOrdersByCampaign = new Map(raffleOrdersEntries);

  const standardOrdersEntries = await Promise.all(
    campaigns
      .filter((c) => c.type === "PADRAO")
      .map(
        async (c) => [c.id, await getCampaignContributionsReport(c.id)] as const,
      ),
  );
  const standardOrdersByCampaign = new Map(standardOrdersEntries);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          Gestão de Campanhas
        </h2>
        <p className="text-base font-semibold text-slate-600">{institution.name}</p>
      </div>

      <CampaignForm />

      {campaigns.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-400">
          Nenhuma campanha cadastrada ainda.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {campaigns.map((campaign) => {
          const goal = campaign.goal;
          const raised = Number(campaign.raisedAmount);
          const progress = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;

          return (
            <div
              key={campaign.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-800">
                      {campaign.title}
                    </h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {CAMPAIGN_TYPE_LABELS[campaign.type]}
                    </span>
                  </div>
                  {campaign.description && (
                    <p className="text-sm text-slate-500">
                      {campaign.description}
                    </p>
                  )}
                </div>
                {campaign.endsAt && (
                  <span className="whitespace-nowrap text-sm text-slate-500">
                    Até{" "}
                    {campaign.endsAt.toLocaleDateString("pt-BR", {
                      timeZone: "UTC",
                    })}
                  </span>
                )}
              </div>

              <div className="h-2.5 w-full rounded-full bg-slate-100">
                <div
                  className="h-2.5 rounded-full bg-[#C9A227]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-slate-700">
                  {formatBRL(raised)} de {formatBRL(goal)} (
                  {progress.toFixed(0)}%)
                </p>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/paroquia/campanhas/${campaign.id}`}
                    className="text-sm text-[#0B2545] underline"
                  >
                    Editar
                  </Link>
                  <DeleteCampaignButton campaignId={campaign.id} />
                </div>
              </div>

              {campaign.type === "RIFA" && (
                <RafflePanel
                  campaign={{
                    id: campaign.id,
                    title: campaign.title,
                    raffleTotalNumbers: campaign.raffleTotalNumbers,
                    raffleNumberPrice:
                      campaign.raffleNumberPrice?.toString() ?? null,
                    raffleSoldCount: campaign.raffleSoldCount,
                    raffleRaisedAmount: campaign.raffleRaisedAmount,
                    pixKey: campaign.pixKey,
                  }}
                  memberOptions={members.map((m) => ({
                    id: m.id,
                    name: m.name,
                    whatsapp: m.whatsapp,
                  }))}
                  orders={(raffleOrdersByCampaign.get(campaign.id) ?? []).map(
                    (order) => ({
                      ...order,
                      createdAt: order.createdAt.toISOString(),
                    }),
                  )}
                />
              )}

              {campaign.type === "PADRAO" && (
                <div className="flex justify-end border-t border-slate-100 pt-3">
                  <StandardCampaignReportModal
                    campaignTitle={campaign.title}
                    orders={(
                      standardOrdersByCampaign.get(campaign.id) ?? []
                    ).map((order) => ({
                      ...order,
                      createdAt: order.createdAt.toISOString(),
                    }))}
                  />
                </div>
              )}

              {campaign.type === "PIZZA" && (
                <PizzaPanel
                  campaign={{
                    id: campaign.id,
                    title: campaign.title,
                    pixKey: campaign.pixKey,
                    pizzaFlavors: campaign.pizzaFlavors.map((flavor) => ({
                      id: flavor.id,
                      name: flavor.name,
                      price: flavor.price.toString(),
                      stockQuantity: flavor.stockQuantity,
                      soldQuantity: flavor.soldQuantity,
                    })),
                  }}
                  memberOptions={members.map((m) => ({
                    id: m.id,
                    name: m.name,
                    whatsapp: m.whatsapp,
                  }))}
                  orders={(pizzaOrdersByCampaign.get(campaign.id) ?? []).map(
                    (order) => ({
                      ...order,
                      createdAt: order.createdAt.toISOString(),
                    }),
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
