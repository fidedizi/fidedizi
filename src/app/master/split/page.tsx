import { SlidersHorizontal } from "lucide-react";
import { requireScope } from "@/lib/dal";
import { UserScope } from "@/generated/prisma/client";
import { listAllInstitutions } from "@/lib/queries/institutions";
import { SplitRow } from "./split-row";

export default async function SplitPage() {
  await requireScope(UserScope.MASTER);

  const institutions = await listAllInstitutions();

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <SlidersHorizontal className="h-4 w-4 text-slate-500" />
        <h2 className="text-sm font-semibold text-slate-800">
          Configuração de Split Parametrizável
        </h2>
      </div>

      <div className="divide-y divide-slate-100">
        {institutions.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">
            Nenhuma instituição cadastrada ainda.
          </p>
        ) : (
          institutions.map((institution) => (
            <SplitRow
              key={institution.id}
              institutionId={institution.id}
              name={institution.name}
              type={institution.type}
              initialRate={
                institution.splitConfig
                  ? Number(institution.splitConfig.commissionRate)
                  : undefined
              }
            />
          ))
        )}
      </div>

      <p className="border-t border-slate-200 px-4 py-3 text-xs text-slate-400">
        A comissão define o percentual que a FideDizi retém de cada
        transação. O restante é creditado diretamente na conta da
        instituição.
      </p>
    </div>
  );
}
