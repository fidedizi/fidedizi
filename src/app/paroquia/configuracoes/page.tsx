import { requireParoquiaContext } from "@/lib/selected-institution";
import { requirePermission } from "@/lib/permissions";
import { PermissionModule } from "@/generated/prisma/client";
import { listFlags } from "@/lib/queries/members";
import { OVERDUE_FLAG_NAME } from "@/lib/overdue";
import { FlagForm } from "./flag-form";
import { InstitutionPixForm } from "./institution-pix-form";

export default async function ConfiguracoesPage() {
  const { user, institution } = await requireParoquiaContext();
  await requirePermission(user, PermissionModule.CONFIGURACOES);
  const allFlags = await listFlags(institution.id);
  const flags = allFlags.filter((flag) => flag.name !== OVERDUE_FLAG_NAME);

  return (
    <div className="flex flex-col gap-6">
      <InstitutionPixForm pixKey={institution.pixKey ?? ""} />

      <h3 className="text-lg font-semibold text-slate-800">
        Pastorais e Movimentos
      </h3>

      <FlagForm />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Nome</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {flags.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-400">
                  Nenhuma pastoral/movimento cadastrada ainda.
                </td>
              </tr>
            )}
            {flags.map((flag) => (
              <tr
                key={flag.id}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="px-4 py-2">{flag.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
