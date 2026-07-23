"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Ticket } from "lucide-react";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { sellTickets } from "@/app/actions/tickets";
import { formatBRL } from "@/lib/format";
import { formatWhatsApp } from "@/lib/whatsapp";

type EventSummary = {
  id: string;
  adultPrice: number;
  childPrice: number;
};

type MemberOption = {
  id: string;
  name: string;
  whatsapp: string;
  email: string;
};

export function SellTicketsModal({
  event,
  memberOptions,
}: {
  event: EventSummary;
  memberOptions: MemberOption[];
}) {
  const [open, setOpen] = useState(false);
  const [adultCount, setAdultCount] = useState(0);
  const [childCount, setChildCount] = useState(0);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [memberId, setMemberId] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const sellTicketsForEvent = sellTickets.bind(null, event.id);
  const [state, action, pending] = useActionState(
    sellTicketsForEvent,
    undefined,
  );

  const { showToast } = useToast();
  const lastStateRef = useRef(state);
  useEffect(() => {
    if (state && state !== lastStateRef.current && state.message && !state.success) {
      showToast(state.message, "error");
    }
    lastStateRef.current = state;
  }, [state, showToast]);

  const total = adultCount * event.adultPrice + childCount * event.childPrice;
  const totalCount = adultCount + childCount;

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
    setBuyerPhone(formatWhatsApp(member.whatsapp));
    setBuyerEmail(member.email);
    setMemberId(member.id);
    setSuggestionsOpen(false);
  }

  function closeAndReset() {
    setOpen(false);
    setAdultCount(0);
    setChildCount(0);
    setBuyerName("");
    setBuyerPhone("");
    setBuyerEmail("");
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
        <Ticket className="h-4 w-4" /> Vender
      </button>
      <Modal open={open} onClose={closeAndReset} title="Venda de Ingressos">
        {state?.success ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-emerald-600">{state.message}</p>
            {state.contributionId && (
              <Link
                href={`/paroquia/eventos/imprimir/${state.contributionId}`}
                className="text-sm text-[#0B2545] underline"
              >
                Imprimir ingressos desta venda
              </Link>
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
                placeholder="Nome completo"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="buyerPhone"
                  className="text-sm font-medium text-slate-700"
                >
                  Telefone
                </label>
                <input
                  id="buyerPhone"
                  name="buyerPhone"
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={buyerPhone}
                  onChange={(e) => {
                    setBuyerPhone(e.target.value);
                    setMemberId("");
                  }}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                {memberId && (
                  <p className="text-xs text-slate-400">
                    Fiel já cadastrado — dados preenchidos automaticamente.
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="buyerEmail"
                  className="text-sm font-medium text-slate-700"
                >
                  E-mail
                </label>
                <input
                  id="buyerEmail"
                  name="buyerEmail"
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => {
                    setBuyerEmail(e.target.value);
                    setMemberId("");
                  }}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                {state?.errors?.buyerEmail && (
                  <p className="text-sm text-red-600">
                    {state.errors.buyerEmail[0]}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md bg-slate-100 px-4 py-3">
              <div>
                <p className="text-xs uppercase text-slate-500">Adulto</p>
                <p className="text-sm font-semibold text-slate-800">
                  {formatBRL(event.adultPrice)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAdultCount((n) => Math.max(0, n - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-white"
                >
                  −
                </button>
                <span className="w-4 text-center text-sm font-semibold">
                  {adultCount}
                </span>
                <button
                  type="button"
                  onClick={() => setAdultCount((n) => n + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-white"
                >
                  +
                </button>
              </div>
            </div>
            <input type="hidden" name="adultCount" value={adultCount} />

            <div className="flex items-center justify-between rounded-md bg-amber-50 px-4 py-3">
              <div>
                <p className="text-xs uppercase text-slate-500">Criança</p>
                <p className="text-sm font-semibold text-slate-800">
                  {formatBRL(event.childPrice)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setChildCount((n) => Math.max(0, n - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-white"
                >
                  −
                </button>
                <span className="w-4 text-center text-sm font-semibold">
                  {childCount}
                </span>
                <button
                  type="button"
                  onClick={() => setChildCount((n) => n + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-white"
                >
                  +
                </button>
              </div>
            </div>
            <input type="hidden" name="childCount" value={childCount} />

            {state?.errors?.adultCount && (
              <p className="text-sm text-red-600">
                {state.errors.adultCount[0]}
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
            </div>

            <div className="border-t border-slate-200 pt-3">
              <p className="text-sm text-slate-500">
                Total ({totalCount} ingressos)
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
