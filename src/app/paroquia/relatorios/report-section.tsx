"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toPng } from "html-to-image";
import {
  CreditCard,
  Banknote,
  Users,
  DollarSign,
  FileText,
  ImageDown,
} from "lucide-react";
import { formatBRL } from "@/lib/format";
import { MonthNavigator } from "@/components/month-navigator";

function StatTile({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof CreditCard;
  value: string;
  label: string;
  tone: "blue" | "green" | "purple" | "amber";
}) {
  const TONE_CLASSES: Record<typeof tone, string> = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    purple: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className={`flex flex-col items-center gap-1 rounded-xl p-4 ${TONE_CLASSES[tone]}`}>
      <Icon className="h-5 w-5" />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}

function FinalidadeRow({
  label,
  value,
  maxValue,
}: {
  label: string;
  value: number;
  maxValue: number;
}) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-sm text-slate-600">{label}</span>
      <div className="h-2.5 flex-1 rounded-full bg-slate-100">
        <div
          className="h-2.5 rounded-full bg-[#0B2545]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-28 shrink-0 text-right text-sm font-semibold text-slate-700">
        {formatBRL(value)}
      </span>
    </div>
  );
}

export function ReportSection({
  year,
  month,
  monthLabel,
  institutionName,
  data,
}: {
  year: number;
  month: number;
  monthLabel: string;
  institutionName: string;
  data: {
    totalGross: number;
    digitalTotal: number;
    cashTotal: number;
    titherCount: number;
    transactionCount: number;
    typeTotals: { DIZIMO: number; OFERTA: number; CAMPANHA: number };
    digital: { pix: number; cartao: number; recorrente: number };
  };
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `prestacao-de-contas-${year}-${String(month).padStart(2, "0")}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setExporting(false);
    }
  }

  const maxFinalidade = Math.max(
    data.typeTotals.DIZIMO,
    data.typeTotals.CAMPANHA,
    data.typeTotals.OFERTA,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <MonthNavigator year={year} month={month} label={monthLabel} />
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 rounded-md bg-[#C9A227] px-4 py-2 text-sm font-semibold text-[#0B2545] transition hover:bg-[#C9A227]/90 disabled:opacity-60"
        >
          <ImageDown className="h-4 w-4" />
          {exporting ? "Exportando..." : "Exportar PNG"}
        </button>
      </div>

      <div
        ref={cardRef}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex items-center justify-between bg-[#0B2545] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#C9A227]">
              Prestação de Contas
            </p>
            <p className="text-xl font-bold text-white">{monthLabel}</p>
            <p className="text-sm text-white/70">{institutionName}</p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#C9A227] text-[#0B2545]">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        <div className="flex flex-col gap-6 p-6">
          <div className="text-center">
            <p className="text-sm text-slate-500">Total Arrecadado</p>
            <p className="text-3xl font-bold text-[#0B2545]">
              {formatBRL(data.totalGross)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              icon={CreditCard}
              value={formatBRL(data.digitalTotal)}
              label="Digital"
              tone="blue"
            />
            <StatTile
              icon={Banknote}
              value={formatBRL(data.cashTotal)}
              label="Espécie"
              tone="green"
            />
            <StatTile
              icon={Users}
              value={String(data.titherCount)}
              label="Dizimistas"
              tone="purple"
            />
            <StatTile
              icon={DollarSign}
              value={String(data.transactionCount)}
              label="Transações"
              tone="amber"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Por Finalidade
            </p>
            <div className="flex flex-col gap-2">
              <FinalidadeRow
                label="Dízimo"
                value={data.typeTotals.DIZIMO}
                maxValue={maxFinalidade}
              />
              <FinalidadeRow
                label="Campanha"
                value={data.typeTotals.CAMPANHA}
                maxValue={maxFinalidade}
              />
              <FinalidadeRow
                label="Oferta"
                value={data.typeTotals.OFERTA}
                maxValue={maxFinalidade}
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Detalhamento Digital
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-200 p-3 text-center">
                <p className="text-lg font-bold text-[#0B2545]">
                  {formatBRL(data.digital.pix)}
                </p>
                <p className="text-xs text-slate-500">PIX</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 text-center">
                <p className="text-lg font-bold text-[#0B2545]">
                  {formatBRL(data.digital.cartao)}
                </p>
                <p className="text-xs text-slate-500">Cartão</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 text-center">
                <p className="text-lg font-bold text-[#0B2545]">
                  {formatBRL(data.digital.recorrente)}
                </p>
                <p className="text-xs text-slate-500">Recorrente</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center border-t border-slate-200 pt-4 text-center">
            <Image
              src="/logo.png"
              alt="FideDizi"
              width={1264}
              height={843}
              className="h-auto w-[12.74rem]"
              unoptimized
            />
          </div>
        </div>
      </div>
    </div>
  );
}
