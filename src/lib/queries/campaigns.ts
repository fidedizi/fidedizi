import "server-only";
import { prisma } from "@/lib/prisma";
import { ContributionStatus } from "@/generated/prisma/client";

export async function listCampaignsWithProgress(institutionId: string) {
  const campaigns = await prisma.campaign.findMany({
    where: { institutionId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { raffleNumbers: true } },
      pizzaFlavors: { orderBy: { createdAt: "asc" } },
    },
  });

  const raisedByCampaign = await prisma.contribution.groupBy({
    by: ["campaignId"],
    where: {
      institutionId,
      status: ContributionStatus.CONFIRMED,
      campaignId: { in: campaigns.map((c) => c.id) },
    },
    _sum: { grossAmount: true },
  });

  const raisedMap = new Map(
    raisedByCampaign
      .filter((r) => r.campaignId)
      .map((r) => [r.campaignId as string, r._sum.grossAmount ?? 0]),
  );

  const flavorIds = campaigns.flatMap((c) => c.pizzaFlavors.map((f) => f.id));
  const soldByFlavor = flavorIds.length
    ? await prisma.pizzaOrderItem.groupBy({
        by: ["flavorId"],
        where: { flavorId: { in: flavorIds } },
        _sum: { quantity: true },
      })
    : [];
  const soldMap = new Map(
    soldByFlavor.map((s) => [s.flavorId, s._sum.quantity ?? 0]),
  );

  return campaigns.map((campaign) => {
    const pizzaFlavors = campaign.pizzaFlavors.map((flavor) => ({
      ...flavor,
      soldQuantity: soldMap.get(flavor.id) ?? 0,
    }));

    // Campanhas do tipo RIFA e PIZZA não têm meta manual — a meta é
    // calculada a partir da própria configuração (números × valor, ou soma
    // dos sabores).
    let goal: number;
    if (campaign.type === "RIFA") {
      goal =
        (campaign.raffleTotalNumbers ?? 0) *
        Number(campaign.raffleNumberPrice ?? 0);
    } else if (campaign.type === "PIZZA") {
      goal = pizzaFlavors.reduce(
        (sum, f) => sum + f.stockQuantity * Number(f.price),
        0,
      );
    } else {
      goal = Number(campaign.goalAmount ?? 0);
    }

    return {
      ...campaign,
      raisedAmount: raisedMap.get(campaign.id) ?? 0,
      goal,
      raffleSoldCount: campaign._count.raffleNumbers,
      raffleRaisedAmount:
        campaign._count.raffleNumbers * Number(campaign.raffleNumberPrice ?? 0),
      pizzaFlavors,
    };
  });
}

export async function listActiveCampaigns(institutionId: string) {
  return prisma.campaign.findMany({
    where: { institutionId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });
}

export async function getCampaignById(campaignId: string, institutionId: string) {
  return prisma.campaign.findFirst({
    where: { id: campaignId, institutionId },
  });
}

export async function getPizzaOrdersReport(campaignId: string) {
  const items = await prisma.pizzaOrderItem.findMany({
    where: { flavor: { campaignId } },
    include: {
      flavor: { select: { name: true, price: true } },
      contribution: {
        select: {
          method: true,
          createdAt: true,
          grossAmount: true,
          buyerName: true,
          buyerPhone: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const orders = new Map<
    string,
    {
      buyerName: string;
      buyerPhone: string | null;
      method: string | null;
      createdAt: Date;
      totalAmount: number;
      items: { flavorName: string; quantity: number; unitPrice: number }[];
    }
  >();

  for (const item of items) {
    const key = item.contributionId ?? item.id;
    if (!orders.has(key)) {
      orders.set(key, {
        buyerName: item.contribution?.buyerName ?? item.buyerName,
        buyerPhone: item.contribution?.buyerPhone ?? item.buyerPhone,
        method: item.contribution?.method ?? null,
        createdAt: item.contribution?.createdAt ?? item.createdAt,
        totalAmount: Number(item.contribution?.grossAmount ?? 0),
        items: [],
      });
    }
    orders.get(key)!.items.push({
      flavorName: item.flavor.name,
      quantity: item.quantity,
      unitPrice: Number(item.flavor.price),
    });
  }

  return Array.from(orders.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

export async function getRaffleOrdersReport(campaignId: string) {
  const raffleNumbers = await prisma.raffleNumber.findMany({
    where: { campaignId },
    include: {
      contribution: {
        select: {
          method: true,
          createdAt: true,
          grossAmount: true,
          buyerName: true,
          buyerPhone: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const orders = new Map<
    string,
    {
      buyerName: string;
      buyerPhone: string | null;
      method: string | null;
      createdAt: Date;
      totalAmount: number;
      numbers: number[];
    }
  >();

  for (const raffleNumber of raffleNumbers) {
    const key = raffleNumber.contributionId ?? raffleNumber.id;
    if (!orders.has(key)) {
      orders.set(key, {
        buyerName: raffleNumber.contribution?.buyerName ?? raffleNumber.buyerName,
        buyerPhone: raffleNumber.contribution?.buyerPhone ?? raffleNumber.buyerPhone,
        method: raffleNumber.contribution?.method ?? null,
        createdAt: raffleNumber.contribution?.createdAt ?? raffleNumber.createdAt,
        totalAmount: Number(raffleNumber.contribution?.grossAmount ?? 0),
        numbers: [],
      });
    }
    orders.get(key)!.numbers.push(raffleNumber.number);
  }

  return Array.from(orders.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

export async function getCampaignContributionsReport(campaignId: string) {
  const contributions = await prisma.contribution.findMany({
    where: { campaignId, status: ContributionStatus.CONFIRMED },
    include: { member: { select: { name: true, whatsapp: true } } },
    orderBy: { createdAt: "desc" },
  });

  return contributions.map((c) => ({
    buyerName: c.member?.name ?? c.buyerName ?? "—",
    buyerPhone: c.member?.whatsapp ?? c.buyerPhone ?? null,
    method: c.method as string,
    createdAt: c.createdAt,
    totalAmount: Number(c.grossAmount),
  }));
}
