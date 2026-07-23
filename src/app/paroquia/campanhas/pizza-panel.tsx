"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Pizza,
  Pencil,
  Trash2,
  Plus,
  MessageCircle,
  ClipboardList,
  Printer,
} from "lucide-react";
import { Modal } from "@/components/modal";
import { useActionToast, useCloseOnSuccess } from "@/components/use-action-toast";
import {
  createPizzaFlavor,
  deletePizzaFlavor,
  sellPizzas,
  updatePizzaFlavor,
} from "@/app/actions/pizza";
import { formatBRL } from "@/lib/format";
import { formatWhatsApp, stripCountryCode } from "@/lib/whatsapp";
import { CONTRIBUTION_METHOD_LABELS } from "@/lib/labels";

type PizzaFlavor = {
  id: string;
  name: string;
  price: string;
  stockQuantity: number;
  soldQuantity: number;
};

type PizzaCampaign = {
  id: string;
  title: string;
  pixKey: string | null;
  pizzaFlavors: PizzaFlavor[];
};

type MemberOption = {
  id: string;
  name: string;
  whatsapp: string;
};

type PizzaOrder = {
  buyerName: string;
  buyerPhone: string | null;
  method: string | null;
  createdAt: string;
  totalAmount: number;
  items: { flavorName: string; quantity: number; unitPrice: number }[];
};

function AddFlavorForm({ campaignId }: { campaignId: string }) {
  const createForCampaign = createPizzaFlavor.bind(null, campaignId);
  const [state, action, pending] = useActionState(createForCampaign, undefined);
  useActionToast(state);

  return (
    <form
      action={action}
      className="grid grid-cols-1 gap-3 rounded-md border border-dashed border-slate-300 p-3 sm:grid-cols-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-xs font-medium text-slate-700">
          Sabor *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        {state?.errors?.name && (
          <p className="text-xs text-red-600">{state.errors.name[0]}</p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="price" className="text-xs font-medium text-slate-700">
          Valor (R$) *
        </label>
        <input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0.01"
          required
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        {state?.errors?.price && (
          <p className="text-xs text-red-600">{state.errors.price[0]}</p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="stockQuantity"
          className="text-xs font-medium text-slate-700"
        >
          Quantidade produzida *
        </label>
        <input
          id="stockQuantity"
          name="stockQuantity"
          type="number"
          step="1"
          min="1"
          required
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        {state?.errors?.stockQuantity && (
          <p className="text-xs text-red-600">
            {state.errors.stockQuantity[0]}
          </p>
        )}
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-1 rounded-md bg-[#0B2545] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0B2545]/90 disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" />
          {pending ? "..." : "Adicionar"}
        </button>
      </div>
    </form>
  );
}

function FlavorRow({ flavor }: { flavor: PizzaFlavor }) {
  const [editing, setEditing] = useState(false);
  const updateForFlavor = updatePizzaFlavor.bind(null, flavor.id);
  const [state, action, pending] = useActionState(updateForFlavor, undefined);
  useActionToast(state);
  useCloseOnSuccess(state, () => setEditing(false));

  const deleteForFlavor = deletePizzaFlavor.bind(null, flavor.id);
  const remaining = flavor.stockQuantity - flavor.soldQuantity;

  if (editing) {
    return (
      <form
        action={action}
        className="grid grid-cols-1 gap-2 rounded-md bg-slate-50 p-3 sm:grid-cols-4"
      >
        <input
          name="name"
          type="text"
          defaultValue={flavor.name}
          required
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        <input
          name="price"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={flavor.price.toString()}
          required
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        <input
          name="stockQuantity"
          type="number"
          step="1"
          min="1"
          defaultValue={flavor.stockQuantity}
          required
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-md bg-[#C9A227] px-2 py-1.5 text-xs font-semibold text-[#0B2545] hover:bg-[#C9A227]/90 disabled:opacity-60"
          >
            {pending ? "..." : "Salvar"}
          </button>
        </div>
        {(state?.errors?.name ||
          state?.errors?.price ||
          state?.errors?.stockQuantity) && (
          <p className="text-xs text-red-600 sm:col-span-4">
            {state?.errors?.name?.[0] ||
              state?.errors?.price?.[0] ||
              state?.errors?.stockQuantity?.[0]}
          </p>
        )}
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2">
      <div>
        <p className="text-sm font-medium text-slate-800">{flavor.name}</p>
        <p className="text-xs text-slate-500">
          {formatBRL(Number(flavor.price))} · {flavor.soldQuantity}/
          {flavor.stockQuantity} vendidas · {remaining} disponível(is)
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Editar sabor"
          className="text-slate-500 hover:text-slate-700"
        >
          <Pencil className="h-4 w-4" />
        </button>
        {flavor.soldQuantity === 0 && (
          <form
            action={deleteForFlavor}
            onSubmit={(e) => {
              if (
                !confirm(`Remover o sabor "${flavor.name}"?`)
              ) {
                e.preventDefault();
              }
            }}
          >
            <button
              type="submit"
              aria-label="Remover sabor"
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function PizzaConfigModal({ campaign }: { campaign: PizzaCampaign }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <Pizza className="h-4 w-4" />
        {campaign.pizzaFlavors.length > 0 ? "Editar Sabores" : "Configurar Pizzas"}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Sabores de Pizza"
        size="lg"
      >
        <div className="flex flex-col gap-3">
          {campaign.pizzaFlavors.length === 0 ? (
            <p className="text-sm text-slate-400">
              Nenhum sabor cadastrado ainda.
            </p>
          ) : (
            campaign.pizzaFlavors.map((flavor) => (
              <FlavorRow key={flavor.id} flavor={flavor} />
            ))
          )}
          <AddFlavorForm campaignId={campaign.id} />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 w-fit rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Fechar
          </button>
        </div>
      </Modal>
    </>
  );
}

function SellPizzaModal({
  campaign,
  memberOptions,
}: {
  campaign: PizzaCampaign;
  memberOptions: MemberOption[];
}) {
  const [open, setOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [memberId, setMemberId] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const sellForCampaign = sellPizzas.bind(null, campaign.id);
  const [state, action, pending] = useActionState(sellForCampaign, undefined);
  useActionToast(state);

  const [orderResult, setOrderResult] = useState<{
    message: string;
    summary: string[];
  } | null>(null);

  useEffect(() => {
    if (state?.success) {
      setOrderResult({ message: state.message ?? "", summary: state.summary ?? [] });
    }
  }, [state]);

  function adjustQty(flavorId: string, delta: number, max: number) {
    setQuantities((q) => {
      const current = q[flavorId] ?? 0;
      return { ...q, [flavorId]: Math.min(max, Math.max(0, current + delta)) };
    });
  }

  const total = campaign.pizzaFlavors.reduce(
    (sum, flavor) => sum + (quantities[flavor.id] ?? 0) * Number(flavor.price),
    0,
  );
  const totalCount = Object.values(quantities).reduce((a, b) => a + b, 0);

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
    setQuantities({});
    setOrderResult(null);
    setBuyerName("");
    setBuyerPhone("");
    setMemberId("");
    setSuggestionsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md bg-[#C9A227] px-4 py-2 text-sm font-semibold text-[#0B2545] transition hover:bg-[#C9A227]/90"
      >
        <Pizza className="h-4 w-4" /> Vender Pizzas
      </button>
      <Modal open={open} onClose={closeAndReset} title="Venda de Pizzas">
        {orderResult ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-emerald-600">{orderResult.message}</p>
            {orderResult.summary.length > 0 && (
              <p className="text-sm text-slate-700">
                Pedido: <span className="font-semibold">{orderResult.summary.join(", ")}</span>
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
            <div className="relative flex flex-col gap-1">
              <label htmlFor="buyerName" className="text-sm font-medium text-slate-700">
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
              <label htmlFor="buyerPhone" className="text-sm font-medium text-slate-700">
                WhatsApp (opcional)
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
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <p className="text-xs text-slate-400">
                {memberId
                  ? "Fiel já cadastrado — dados preenchidos automaticamente."
                  : "Venda manual: deixe em branco. Venda pelo WhatsApp: informe o número para enviar a confirmação do pedido."}
              </p>
              {state?.errors?.buyerPhone && (
                <p className="text-sm text-red-600">
                  {state.errors.buyerPhone[0]}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {campaign.pizzaFlavors.map((flavor) => {
                const remaining = flavor.stockQuantity - flavor.soldQuantity;
                const qty = quantities[flavor.id] ?? 0;
                return (
                  <div
                    key={flavor.id}
                    className="flex items-center justify-between rounded-md bg-slate-100 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {flavor.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatBRL(Number(flavor.price))} · {remaining}{" "}
                        disponível(is)
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => adjustQty(flavor.id, -1, remaining)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-white"
                      >
                        −
                      </button>
                      <span className="w-4 text-center text-sm font-semibold">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustQty(flavor.id, 1, remaining)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-white"
                      >
                        +
                      </button>
                    </div>
                    <input
                      type="hidden"
                      name={`flavor_${flavor.id}`}
                      value={qty}
                    />
                  </div>
                );
              })}
            </div>

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
                Total ({totalCount} pizza{totalCount !== 1 ? "s" : ""})
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
                disabled={pending || totalCount === 0}
                className="flex items-center gap-2 rounded-md bg-[#C9A227] px-4 py-2 text-sm font-semibold text-[#0B2545] transition hover:bg-[#C9A227]/90 disabled:opacity-60"
              >
                <MessageCircle className="h-4 w-4" />
                {pending ? "Confirmando..." : "Registrar Venda"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

function PizzaReportModal({
  campaignTitle,
  orders,
}: {
  campaignTitle: string;
  orders: PizzaOrder[];
}) {
  const [open, setOpen] = useState(false);

  const totalQuantity = orders.reduce(
    (sum, order) =>
      sum + order.items.reduce((s, item) => s + item.quantity, 0),
    0,
  );
  const totalValue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  const flavorTotals = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items) {
      flavorTotals.set(
        item.flavorName,
        (flavorTotals.get(item.flavorName) ?? 0) + item.quantity,
      );
    }
  }

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
        title="Relatório de Vendas de Pizza"
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
                    <th className="px-2 py-2 font-medium">Sabores</th>
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
                        {order.items
                          .map((item) => `${item.quantity}x ${item.flavorName}`)
                          .join(", ")}
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

          {flavorTotals.size > 0 && (
            <div className="flex flex-col gap-2 border-t border-slate-200 pt-3">
              <p className="text-sm font-medium text-slate-700">
                Total vendido por sabor
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.from(flavorTotals.entries()).map(([name, qty]) => (
                  <span
                    key={name}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                  >
                    {name}: {qty}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
            <span className="text-slate-500">
              Total: {totalQuantity} pizza{totalQuantity !== 1 ? "s" : ""}{" "}
              vendida{totalQuantity !== 1 ? "s" : ""}
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
              Relatório de Vendas de Pizza
            </h1>
            <p className="mb-4 text-sm text-slate-500">{campaignTitle}</p>

            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-300 py-1.5 pr-2 font-medium">
                    Comprador
                  </th>
                  <th className="border-b border-slate-300 py-1.5 pr-2 font-medium">
                    Sabores
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
                      {order.items
                        .map((item) => `${item.quantity}x ${item.flavorName}`)
                        .join(", ")}
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

            {flavorTotals.size > 0 && (
              <>
                <h2 className="mt-6 mb-2 text-sm font-semibold text-slate-800">
                  Total vendido por sabor
                </h2>
                <table className="w-full max-w-xs text-left text-sm">
                  <tbody>
                    {Array.from(flavorTotals.entries()).map(([name, qty]) => (
                      <tr key={name}>
                        <td className="border-b border-slate-200 py-1 pr-2">
                          {name}
                        </td>
                        <td className="border-b border-slate-200 py-1 text-right">
                          {qty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-slate-300 pt-2 text-sm font-semibold">
              <span>
                Total: {totalQuantity} pizza{totalQuantity !== 1 ? "s" : ""}{" "}
                vendida{totalQuantity !== 1 ? "s" : ""}
              </span>
              <span>{formatBRL(totalValue)}</span>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export function PizzaPanel({
  campaign,
  memberOptions,
  orders,
}: {
  campaign: PizzaCampaign;
  memberOptions: MemberOption[];
  orders: PizzaOrder[];
}) {
  const hasFlavors = campaign.pizzaFlavors.length > 0;
  const totalStock = campaign.pizzaFlavors.reduce(
    (sum, f) => sum + f.stockQuantity,
    0,
  );
  const totalSold = campaign.pizzaFlavors.reduce(
    (sum, f) => sum + f.soldQuantity,
    0,
  );
  const totalRevenue = campaign.pizzaFlavors.reduce(
    (sum, f) => sum + f.soldQuantity * Number(f.price),
    0,
  );

  return (
    <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
      <div className="flex flex-wrap items-center gap-3">
        {hasFlavors && (
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span>
              {totalSold}/{totalStock} pizzas vendidas
            </span>
            <span>{formatBRL(totalRevenue)} arrecadado</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-3">
          <PizzaReportModal campaignTitle={campaign.title} orders={orders} />
          {hasFlavors && (
            <SellPizzaModal campaign={campaign} memberOptions={memberOptions} />
          )}
          <PizzaConfigModal campaign={campaign} />
        </div>
      </div>

      {hasFlavors && (
        <div className="flex flex-wrap gap-2">
          {campaign.pizzaFlavors.map((flavor) => (
            <span
              key={flavor.id}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
            >
              {flavor.name}: {flavor.soldQuantity}/{flavor.stockQuantity} vendidas ·{" "}
              {formatBRL(flavor.soldQuantity * Number(flavor.price))}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
