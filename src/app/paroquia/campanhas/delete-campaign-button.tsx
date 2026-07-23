"use client";

import { deleteCampaign } from "@/app/actions/campaigns";

export function DeleteCampaignButton({ campaignId }: { campaignId: string }) {
  const deleteCampaignWithId = deleteCampaign.bind(null, campaignId);

  return (
    <form
      action={deleteCampaignWithId}
      onSubmit={(e) => {
        if (
          !confirm(
            "Tem certeza que deseja excluir esta campanha? As contribuições já registradas não serão apagadas, apenas perderão o vínculo com a campanha.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="text-sm text-red-600 underline"
      >
        Excluir
      </button>
    </form>
  );
}
