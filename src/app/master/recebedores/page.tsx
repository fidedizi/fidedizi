import { requireScope } from "@/lib/dal";
import { UserScope } from "@/generated/prisma/client";
import { listAllInstitutions } from "@/lib/queries/institutions";
import {
  GATEWAY_PROVIDER_LABELS,
  INSTITUTION_TYPE_LABELS,
  RECEIVER_STATUS_LABELS,
} from "@/lib/labels";
import { ReceiverForm } from "./receiver-form";

export default async function RecebedoresPage() {
  await requireScope(UserScope.MASTER);

  const institutions = await listAllInstitutions();

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-slate-800">
        Onboarding de Recebedores
      </h2>

      <p className="text-sm text-slate-500">
        Sem integração ativa com o gateway de pagamento ainda — os registros
        abaixo ficam como &quot;Pendente&quot; até a conexão real com
        Pagar.me/Asaas ser configurada.
      </p>

      <ReceiverForm
        institutionOptions={institutions.map((i) => ({
          id: i.id,
          name: i.name,
        }))}
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Instituição</th>
              <th className="px-4 py-2 font-medium">Tipo</th>
              <th className="px-4 py-2 font-medium">Gateway</th>
              <th className="px-4 py-2 font-medium">ID do Recebedor</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {institutions.length === 0 && (
              <tr>
                <td
                  colSpan={5}
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
                <td className="px-4 py-2">
                  {institution.receiver
                    ? GATEWAY_PROVIDER_LABELS[
                        institution.receiver.gatewayProvider
                      ]
                    : "—"}
                </td>
                <td className="px-4 py-2">
                  {institution.receiver?.externalId ?? "—"}
                </td>
                <td className="px-4 py-2">
                  {institution.receiver
                    ? RECEIVER_STATUS_LABELS[institution.receiver.status]
                    : "Não iniciado"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
