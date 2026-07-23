import { requireScope } from "@/lib/dal";
import { UserScope, InstitutionStatus } from "@/generated/prisma/client";
import { listAllInstitutions } from "@/lib/queries/institutions";
import { setInstitutionStatus } from "@/app/actions/institutions";
import {
  INSTITUTION_STATUS_LABELS,
  INSTITUTION_TYPE_LABELS,
} from "@/lib/labels";
import { InstitutionForm } from "./institution-form";
import { EditInstitutionModal } from "./edit-institution-modal";

export default async function LicenciamentoPage() {
  await requireScope(UserScope.MASTER);

  const institutions = await listAllInstitutions();

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-slate-800">
        Gestão de Licenciamento
      </h2>

      <InstitutionForm
        parentOptions={institutions.map((i) => ({ id: i.id, name: i.name }))}
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">Tipo</th>
              <th className="px-4 py-2 font-medium">CNPJ</th>
              <th className="px-4 py-2 font-medium">Instituição Superior</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {institutions.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  Nenhuma instituição cadastrada ainda.
                </td>
              </tr>
            )}
            {institutions.map((institution) => (
              <tr
                key={institution.id}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="px-4 py-2">{institution.name}</td>
                <td className="px-4 py-2">
                  {INSTITUTION_TYPE_LABELS[institution.type]}
                </td>
                <td className="px-4 py-2">{institution.cnpj}</td>
                <td className="px-4 py-2">
                  {institution.parent?.name ?? "—"}
                </td>
                <td className="px-4 py-2">
                  {INSTITUTION_STATUS_LABELS[institution.status]}
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-2">
                    <EditInstitutionModal
                      institution={{
                        id: institution.id,
                        type: institution.type,
                        name: institution.name,
                        cnpj: institution.cnpj,
                        parentId: institution.parentId ?? "",
                      }}
                      parentOptions={institutions.map((i) => ({
                        id: i.id,
                        name: i.name,
                      }))}
                    />
                    {institution.status !== InstitutionStatus.ACTIVE && (
                      <form
                        action={setInstitutionStatus.bind(
                          null,
                          institution.id,
                          InstitutionStatus.ACTIVE,
                        )}
                      >
                        <button
                          type="submit"
                          className="rounded-md border border-emerald-600 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                        >
                          Ativar
                        </button>
                      </form>
                    )}
                    {institution.status !== InstitutionStatus.SUSPENDED && (
                      <form
                        action={setInstitutionStatus.bind(
                          null,
                          institution.id,
                          InstitutionStatus.SUSPENDED,
                        )}
                      >
                        <button
                          type="submit"
                          className="rounded-md border border-amber-600 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50"
                        >
                          Suspender
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
