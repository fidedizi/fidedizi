import "server-only";
import { prisma } from "@/lib/prisma";
import { ContributionStatus, ContributionType } from "@/generated/prisma/client";

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const MONTH_LABELS_FULL = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// Mês de calendário no formato usado por toda esta tela: year = ano cheio,
// month = 1-12 (não o índice 0-11 do JS Date).
export type CalendarMonth = { year: number; month: number };

export function monthRange({ year, month }: CalendarMonth) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

export function monthLabel({ year, month }: CalendarMonth) {
  return `${MONTH_LABELS[month - 1]}/${year}`;
}

export function monthLabelFull({ year, month }: CalendarMonth) {
  return `${MONTH_LABELS_FULL[month - 1]} de ${year}`;
}

export function shiftMonth({ year, month }: CalendarMonth, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function parseSelectedMonth(params: {
  year?: string;
  month?: string;
}): CalendarMonth {
  const now = new Date();
  const year = Number(params.year);
  const month = Number(params.month);

  const validYear = Number.isInteger(year) && year > 2000 ? year : now.getFullYear();
  const validMonth =
    Number.isInteger(month) && month >= 1 && month <= 12
      ? month
      : now.getMonth() + 1;

  return { year: validYear, month: validMonth };
}

// Fiel que já contribuiu com dízimo ao menos uma vez (histórico completo,
// não é escopado por mês).
export async function getActiveTithersCount(institutionIds: string[]) {
  const distinctTithers = await prisma.contribution.findMany({
    where: {
      institutionId: { in: institutionIds },
      status: ContributionStatus.CONFIRMED,
      type: ContributionType.DIZIMO,
      memberId: { not: null },
    },
    distinct: ["memberId"],
    select: { memberId: true },
  });

  return distinctTithers.length;
}

export async function getContributorsCountForMonth(
  institutionIds: string[],
  target: CalendarMonth,
) {
  const { start, end } = monthRange(target);

  const distinctContributors = await prisma.contribution.findMany({
    where: {
      institutionId: { in: institutionIds },
      status: ContributionStatus.CONFIRMED,
      createdAt: { gte: start, lt: end },
      memberId: { not: null },
    },
    distinct: ["memberId"],
    select: { memberId: true },
  });

  return distinctContributors.length;
}

export async function getMonthlyTotalsByType(
  institutionIds: string[],
  target: CalendarMonth,
) {
  const { start, end } = monthRange(target);

  const totals = await prisma.contribution.groupBy({
    by: ["type"],
    where: {
      institutionId: { in: institutionIds },
      status: ContributionStatus.CONFIRMED,
      createdAt: { gte: start, lt: end },
    },
    _sum: { grossAmount: true },
  });

  const result: Record<ContributionType, number> = {
    DIZIMO: 0,
    OFERTA: 0,
    CAMPANHA: 0,
    EVENTO: 0,
  };
  for (const t of totals) result[t.type] = Number(t._sum.grossAmount ?? 0);
  return result;
}

// Série de N meses (padrão 6) terminando no mês selecionado, para o
// gráfico de Evolução Mensal (Dízimo x Campanha).
export async function getMonthlyTrend(
  institutionIds: string[],
  endMonth: CalendarMonth,
  monthsBack = 6,
) {
  const months: CalendarMonth[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    months.push(shiftMonth(endMonth, -i));
  }

  return Promise.all(
    months.map(async (month) => {
      const totals = await getMonthlyTotalsByType(institutionIds, month);
      return {
        label: monthLabel(month),
        dizimo: totals.DIZIMO,
        campanha: totals.CAMPANHA,
      };
    }),
  );
}
