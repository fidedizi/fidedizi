"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { Modal } from "@/components/modal";
import { getMemberRelationships } from "@/app/actions/members";
import { formatBRL } from "@/lib/format";

type Relationship = {
  id: string;
  label: string;
  createdAt: string;
  value: number;
};

export function MemberRelationshipsModal({
  memberId,
  memberName,
}: {
  memberId: string;
  memberName: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [relationships, setRelationships] = useState<Relationship[] | null>(
    null,
  );

  async function handleOpen() {
    setOpen(true);
    if (relationships === null) {
      setLoading(true);
      const data = await getMemberRelationships(memberId);
      setRelationships(data);
      setLoading(false);
    }
  }

  const total = (relationships ?? []).reduce((sum, r) => sum + r.value, 0);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Ver relacionamentos"
        title="Relacionamentos"
        className="flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition hover:text-[#0B2545]"
      >
        <History className="h-4 w-4" />
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Relacionamentos — ${memberName}`}
        size="lg"
      >
        <div className="flex flex-col gap-4">
          {loading ? (
            <p className="text-sm text-slate-400">Carregando...</p>
          ) : relationships && relationships.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-2 py-2 font-medium">Relacionamento</th>
                    <th className="px-2 py-2 font-medium">Data</th>
                    <th className="px-2 py-2 text-right font-medium">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {relationships.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-2 py-2">{r.label}</td>
                      <td className="px-2 py-2">
                        {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-2 py-2 text-right font-medium">
                        {formatBRL(r.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Nenhum relacionamento registrado ainda.
            </p>
          )}

          {relationships && relationships.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
              <span className="text-slate-500">
                Total: {relationships.length} registro
                {relationships.length !== 1 ? "s" : ""}
              </span>
              <span className="text-lg font-bold text-[#0B2545]">
                {formatBRL(total)}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-fit rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Fechar
          </button>
        </div>
      </Modal>
    </>
  );
}
