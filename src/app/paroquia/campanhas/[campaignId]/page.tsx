import { notFound } from "next/navigation";
import { requireParoquiaContext } from "@/lib/selected-institution";
import { requirePermission } from "@/lib/permissions";
import { PermissionModule } from "@/generated/prisma/client";
import { getCampaignById } from "@/lib/queries/campaigns";
import { EditCampaignForm } from "./edit-campaign-form";

export default async function EditarCampanhaPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { user, institution } = await requireParoquiaContext();
  await requirePermission(user, PermissionModule.CAMPANHAS);
  const { campaignId } = await params;

  const campaign = await getCampaignById(campaignId, institution.id);

  if (!campaign) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-slate-800">
        Editar Campanha
      </h2>
      <EditCampaignForm
        campaign={{
          id: campaign.id,
          type: campaign.type,
          title: campaign.title,
          description: campaign.description ?? "",
          goalAmount: campaign.goalAmount?.toString() ?? "",
          endsAt: campaign.endsAt
            ? campaign.endsAt.toISOString().slice(0, 10)
            : "",
          pixKey: campaign.pixKey ?? "",
        }}
      />
    </div>
  );
}
