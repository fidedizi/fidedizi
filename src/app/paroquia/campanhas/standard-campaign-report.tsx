"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ClipboardList, Printer } from "lucide-react";
import { Modal } from "@/components/modal";
import { formatBRL } from "@/lib/format";
import { formatWhatsApp } from "@/lib/whatsapp";
import { CONTRIBUTION_METHOD_LABELS } from "@/lib/labels";

type DonationOrder = {
  buyerName: string;
  buyerPhone: string | null;
  method: string;
  createdAt: string;
  totalAmount: number;
};

export function StandardCampaignReportModal({
  campaignTitle,
  orders,
}: {
  campaignTitle: string;
  orders: DonationOrder[];
}) {
  const [open, setOpen] = useState(false);

  const totalValue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  function handlePrint() {
    document.body.classList.add("printing-pizza-report");
    window.print();
  }

  useEffect(() => {
    function handleAfterPrint() {
      document.body.classList.remove("printing-pizza-report");
    }
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <ClipboardList className="h-4 w-4" /> Relatório
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Relatório de Contribuições"
        size="lg"
      >
        <div className="flex flex-col gap-4">
          {orders.length === 0 ? (
            <p className="text-sm text-slate-400">
              Nenhuma contribuição registrada ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-2 py-2 font-medium">Doador</th>
                    <th className="px-2 py-2 font-medium">Pagamento</th>
                    <th className="px-2 py-2 font-medium">Data</th>
                    <th className="px-2 py-2 text-right font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {orders.map((order, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-2 py-2">
                        <p className="font-medium text-slate-800">
                          {order.buyerName}
                        </p>
                        {order.buyerPhone && (
                          <p className="text-xs text-slate-500">
                            {formatWhatsApp(order.buyerPhone)}
                          </p>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {CONTRIBUTION_METHOD_LABELS[order.method]}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-2 py-2 text-right font-medium">
                        {formatBRL(order.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
            <span className="text-slate-500">
              Total: {orders.length}{" "}
              {orders.length === 1 ? "contribuição" : "contribuições"}
            </span>
            <span className="text-lg font-bold text-[#0B2545]">
              {formatBRL(totalValue)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-fit rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Fechar
            </button>
            {orders.length > 0 && (
              <button
                type="button"
                onClick={handlePrint}
                className="flex w-fit items-center gap-2 rounded-md bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0B2545]/90"
              >
                <Printer className="h-4 w-4" /> Imprimir
              </button>
            )}
          </div>
        </div>
      </Modal>

      {open &&
        createPortal(
          <div className="pizza-print-report hidden print:block">
            <h1 className="text-lg font-bold text-slate-900">
              Relatório de Contribuições
            </h1>
            <p className="mb-4 text-sm text-slate-500">{campaignTitle}</p>

            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-300 py-1.5 pr-2 font-medium">
                    Doador
                  </th>
                  <th className="border-b border-slate-300 py-1.5 pr-2 font-medium">
                    Pagamento
                  </th>
                  <th className="border-b border-slate-300 py-1.5 pr-2 font-medium">
                    Data
                  </th>
                  <th className="border-b border-slate-300 py-1.5 text-right font-medium">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={index}>
                    <td className="border-b border-slate-200 py-1.5 pr-2">
                      {order.buyerName}
                      {order.buyerPhone && (
                        <>
                          <br />
                          <span className="text-xs text-slate-500">
                            {formatWhatsApp(order.buyerPhone)}
                          </span>
                        </>
                      )}
                    </td>
                    <td className="border-b border-slate-200 py-1.5 pr-2">
                      {CONTRIBUTION_METHOD_LABELS[order.method]}
                    </td>
                    <td className="border-b border-slate-200 py-1.5 pr-2">
                      {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="border-b border-slate-200 py-1.5 text-right">
                      {formatBRL(order.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex items-center justify-between border-t border-slate-300 pt-2 text-sm font-semibold">
              <span>
                Total: {orders.length}{" "}
                {orders.length === 1 ? "contribuição" : "contribuições"}
              </span>
              <span>{formatBRL(totalValue)}</span>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
