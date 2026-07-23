"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Settings, MessageCircle, ClipboardList, Printer } from "lucide-react";
import { Modal } from "@/components/modal";
import { useActionToast, useCloseOnSuccess } from "@/components/use-action-toast";
import { configureRaffle, sellRaffleNumbers } from "@/app/actions/raffle";
import { formatBRL } from "@/lib/format";
import { formatWhatsApp, stripCountryCode } from "@/lib/whatsapp";
import { CONTRIBUTION_METHOD_LABELS } from "@/lib/labels";

type RaffleOrder = {
  buyerName: string;
  buyerPhone: string | null;
  method: string | null;
  createdAt: string;
  totalAmount: number;
  numbers: number[];
};

type RaffleCampaign = {
  id: string;
  title: string;
  raffleTotalNumbers: number | null;
  raffleNumberPrice: string | null;
  raffleSoldCount: number;
  raffleRaisedAmount: number;
  pixKey: string | null;
};

type MemberOption = {
  id: string;
  name: string;
  whatsapp: string;
};

function ConfigureRaffleModal({ campaign }: { campaign: RaffleCampaign }) {
  const [open, setOpen] = useState(false);
  const configureForCampaign = configureRaffle.bind(null, campaign.id);
  const [state, action, pending] = useActionState(
    configureForCampaign,
    undefined,
  );
  useActionToast(state);
  useCloseOnSuccess(state, () => setOpen(false));

  const isConfigured = campaign.raffleTotalNumbers != null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <Settings className="h-4 w-4" />
        {isConfigured ? "Editar Rifa" : "Configurar Rifa"}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Configuração da Rifa"
      >
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="raffleTotalNumbers"
              className="text-sm font-medium text-slate-700"
            >
              Quantidade de números a serem vendidos *
            </label>
            <input
              id="raffleTotalNumbers"
              name="raffleTotalNumbers"
              type="number"
              step="1"
              min="1"
              defaultValue={campaign.raffleTotalNumbers ?? ""}
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            {state?.errors?.raffleTotalNumbers && (
              <p className="text-sm text-red-600">
                {state.errors.raffleTotalNumbers[0]}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="raffleNumberPrice"
              className="text-sm font-medium text-slate-700"
            >
              Valor da rifa (R$) *
            </label>
            <input
              id="raffleNumberPrice"
              name="raffleNumberPrice"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={campaign.raffleNumberPrice ?? ""}
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            {state?.errors?.raffleNumberPrice && (
              <p className="text-sm text-red-600">
                {state.errors.raffleNumberPrice[0]}
              </p>
            )}
          </div>

          {isConfigured && (
            <div className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
              {campaign.raffleSoldCount} número(s) já vendido(s) ·{" "}
              {formatBRL(campaign.raffleRaisedAmount)} arrecadado
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-[#C9A227] px-4 py-2 text-sm font-semibold text-[#0B2545] transition hover:bg-[#C9A227]/90 disabled:opacity-60"
            >
              {pending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function SellRaffleModal({
  campaign,
  memberOptions,
}: {
  campaign: RaffleCampaign;
  memberOptions: MemberOption[];
}) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [memberId, setMemberId] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const sellForCampaign = sellRaffleNumbers.bind(null, campaign.id);
  const [state, action, pending] = useActionState(sellForCampaign, undefined);
  useActionToast(state);

  const [orderResult, setOrderResult] = useState<{
    message: string;
    numbers: number[];
  } | null>(null);

  useEffect(() => {
    if (state?.success) {
      setOrderResult({ message: state.message ?? "", numbers: state.numbers ?? [] });
    }
  }, [state]);

  const numberPrice = Number(campaign.raffleNumberPrice ?? 0);
  const remaining =
    (campaign.raffleTotalNumbers ?? 0) - campaign.raffleSoldCount;
  const total = quantity * numberPrice;

  const normalizedQuery = buyerName.trim().toLowerCase();
  const queryDigits = buyerName.replace(/\D/g, "");
  const suggestions = normalizedQuery
    ? memberOptions
        .filter((m) => {
          const nameMatch = m.name.toLowerCase().includes(normalizedQuery);
          const phoneMatch =
            queryDigits.length >= 3 &&
            m.whatsapp.replace(/\D/g, "").includes(queryDigits);
          return nameMatch || phoneMatch;
        })
        .slice(0, 8)
    : [];

  function selectMember(member: MemberOption) {
    setBuyerName(member.name);
    setBuyerPhone(stripCountryCode(member.whatsapp));
    setMemberId(member.id);
    setSuggestionsOpen(false);
  }

  function closeAndReset() {
    setOpen(false);
    setQuantity(1);
    setBuyerName("");
    setBuyerPhone("");
    setMemberId("");
    setSuggestionsOpen(false);
    setOrderResult(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md bg-[#C9A227] px-4 py-2 text-sm font-semibold text-[#0B2545] transition hover:bg-[#C9A227]/90"
      >
        <MessageCircle className="h-4 w-4" /> Vender pelo WhatsApp
      </button>
      <Modal open={open} onClose={closeAndReset} title="Venda de Números da Rifa">
        {orderResult ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-emerald-600">{orderResult.message}</p>
            {orderResult.numbers.length > 0 && (
              <p className="text-sm text-slate-700">
                Número(s) atribuído(s):{" "}
                <span className="font-semibold">
                  {orderResult.numbers.join(", ")}
                </span>
              </p>
            )}
            <button
              type="button"
              onClick={closeAndReset}
              className="w-fit rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form action={action} className="flex flex-col gap-4">
            <p className="text-sm text-slate-500">
              {remaining} de {campaign.raffleTotalNumbers} número(s) disponível(is)
            </p>

            <div className="relative flex flex-col gap-1">
              <label
                htmlFor="buyerName"
                className="text-sm font-medium text-slate-700"
              >
                Nome do Comprador *
              </label>
              <input
                id="buyerName"
                name="buyerName"
                type="text"
                autoComplete="off"
                value={buyerName}
                onChange={(e) => {
                  setBuyerName(e.target.value);
                  setMemberId("");
                  setSuggestionsOpen(true);
                }}
                onFocus={() => setSuggestionsOpen(true)}
                onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
                required
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input type="hidden" name="memberId" value={memberId} />
              {state?.errors?.buyerName && (
                <p className="text-sm text-red-600">
                  {state.errors.buyerName[0]}
                </p>
              )}

              {suggestionsOpen && suggestions.length > 0 && (
                <div className="absolute top-full left-0 z-10 mt-1 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg max-h-56">
                  {suggestions.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectMember(m)}
                      className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-slate-100"
                    >
                      <span className="font-medium text-slate-800">
                        {m.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatWhatsApp(m.whatsapp)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="buyerPhone"
                className="text-sm font-medium text-slate-700"
              >
                WhatsApp *
              </label>
              <input
                id="buyerPhone"
                name="buyerPhone"
                type="text"
                placeholder="DDD + número, somente números"
                value={buyerPhone}
                onChange={(e) => {
                  setBuyerPhone(e.target.value);
                  setMemberId("");
                }}
                required
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <p className="text-xs text-slate-400">
                {memberId
                  ? "Fiel já cadastrado — dados preenchidos automaticamente."
                  : "A confirmação da venda será enviada para este número."}
              </p>
              {state?.errors?.buyerPhone && (
                <p className="text-sm text-red-600">
                  {state.errors.buyerPhone[0]}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-md bg-slate-100 px-4 py-3">
              <div>
                <p className="text-xs uppercase text-slate-500">
                  Valor por número
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {formatBRL(numberPrice)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((n) => Math.max(1, n - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-white"
                >
                  −
                </button>
                <span className="w-4 text-center text-sm font-semibold">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((n) => Math.min(remaining, n + 1))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-white"
                >
                  +
                </button>
              </div>
            </div>
            <input type="hidden" name="quantity" value={quantity} />
            {state?.errors?.quantity && (
              <p className="text-sm text-red-600">
                {state.errors.quantity[0]}
              </p>
            )}

            <div className="flex flex-col gap-1">
              <label
                htmlFor="paymentMethod"
                className="text-sm font-medium text-slate-700"
              >
                Forma de Pagamento
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="PIX">PIX</option>
                <option value="CARTAO">Cartão</option>
                <option value="ESPECIE">Dinheiro</option>
              </select>
              {campaign.pixKey && (
                <p className="text-xs text-slate-400">
                  Chave Pix desta campanha:{" "}
                  <span className="font-medium text-slate-600">
                    {campaign.pixKey}
                  </span>
                </p>
              )}
            </div>

            <div className="border-t border-slate-200 pt-3">
              <p className="text-sm text-slate-500">
                Total ({quantity} número{quantity > 1 ? "s" : ""})
              </p>
              <p className="text-2xl font-bold text-[#0B2545]">
                {formatBRL(total)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={closeAndReset}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pending || remaining <= 0}
                className="rounded-md bg-[#C9A227] px-4 py-2 text-sm font-semibold text-[#0B2545] transition hover:bg-[#C9A227]/90 disabled:opacity-60"
              >
                {pending ? "Confirmando..." : "Confirmar Venda"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

function RaffleReportModal({
  campaignTitle,
  orders,
}: {
  campaignTitle: string;
  orders: RaffleOrder[];
}) {
  const [open, setOpen] = useState(false);

  const totalQuantity = orders.reduce(
    (sum, order) => sum + order.numbers.length,
    0,
  );
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
        title="Relatório de Vendas da Rifa"
        size="lg"
      >
        <div className="flex flex-col gap-4">
          {orders.length === 0 ? (
            <p className="text-sm text-slate-400">
              Nenhuma venda registrada ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-2 py-2 font-medium">Comprador</th>
                    <th className="px-2 py-2 font-medium">Números</th>
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
                        {order.numbers.join(", ")}
                      </td>
                      <td className="px-2 py-2">
                        {order.method
                          ? CONTRIBUTION_METHOD_LABELS[order.method]
                          : "—"}
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
              Total: {totalQuantity} número{totalQuantity !== 1 ? "s" : ""}{" "}
              vendido{totalQuantity !== 1 ? "s" : ""}
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
              Relatório de Vendas da Rifa
            </h1>
            <p className="mb-4 text-sm text-slate-500">{campaignTitle}</p>

            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-300 py-1.5 pr-2 font-medium">
                    Comprador
                  </th>
                  <th className="border-b border-slate-300 py-1.5 pr-2 font-medium">
                    Números
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
                      {order.numbers.join(", ")}
                    </td>
                    <td className="border-b border-slate-200 py-1.5 pr-2">
                      {order.method
                        ? CONTRIBUTION_METHOD_LABELS[order.method]
                        : "—"}
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
                Total: {totalQuantity} número{totalQuantity !== 1 ? "s" : ""}{" "}
                vendido{totalQuantity !== 1 ? "s" : ""}
              </span>
              <span>{formatBRL(totalValue)}</span>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export function RafflePanel({
  campaign,
  memberOptions,
  orders,
}: {
  campaign: RaffleCampaign;
  memberOptions: MemberOption[];
  orders: RaffleOrder[];
}) {
  const isConfigured = campaign.raffleTotalNumbers != null;

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
      {isConfigured && (
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span>
            {campaign.raffleSoldCount}/{campaign.raffleTotalNumbers} números
            vendidos
          </span>
          <span>{formatBRL(campaign.raffleRaisedAmount)} arrecadado</span>
        </div>
      )}
      <div className="ml-auto flex items-center gap-3">
        <RaffleReportModal campaignTitle={campaign.title} orders={orders} />
        {isConfigured && (
          <SellRaffleModal campaign={campaign} memberOptions={memberOptions} />
        )}
        <ConfigureRaffleModal campaign={campaign} />
      </div>
    </div>
  );
}
