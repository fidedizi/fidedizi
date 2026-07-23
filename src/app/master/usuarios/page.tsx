import { Users2 } from "lucide-react";
import { requireScope } from "@/lib/dal";
import { UserScope } from "@/generated/prisma/client";
import { listAllUsers } from "@/lib/queries/users";
import { listAllInstitutions } from "@/lib/queries/institutions";
import { institutionBreadcrumb, USER_SCOPE_LABELS } from "@/lib/labels";
import { NewUserModal } from "./new-user-modal";
import { RevokeUserButton } from "./revoke-user-button";
import { ResendInviteButton } from "./resend-invite-button";

export default async function UsuariosPage() {
  const currentUser = await requireScope(UserScope.MASTER);

  const [users, institutions] = await Promise.all([
    listAllUsers(),
    listAllInstitutions(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-[#0B2545]">
            <Users2 className="h-5 w-5 text-[#C9A227]" />
            Gestão de Usuários
          </h2>
          <p className="text-sm text-slate-500">
            Todos os usuários cadastrados no sistema, em qualquer paróquia,
            capela ou comunidade.
          </p>
        </div>
        <NewUserModal
          institutionOptions={institutions.map((institution) => ({
            id: institution.id,
            name: institution.name,
            type: institution.type,
          }))}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">
                Paróquia/Capela/Comunidade
              </th>
              <th className="px-4 py-2 font-medium">E-mail</th>
              <th className="px-4 py-2 font-medium">Acesso</th>
              <th className="px-4 py-2 font-medium">Cadastrado em</th>
              <th className="px-4 py-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Nenhum usuário cadastrado ainda.
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2">
                  {user.name}
                  {user.isOwner && (
                    <span className="ml-2 rounded-full bg-[#F5E9D6] px-2 py-0.5 text-xs font-medium text-[#0B2545]">
                      Proprietário
                    </span>
                  )}
                  {user.passwordSetupToken && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Pendente
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {institutionBreadcrumb(user.institution)}
                </td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">{USER_SCOPE_LABELS[user.scope]}</td>
                <td className="px-4 py-2">
                  {new Intl.DateTimeFormat("pt-BR").format(user.createdAt)}
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-2">
                    {user.passwordSetupToken && (
                      <ResendInviteButton userId={user.id} />
                    )}
                    {user.id !== currentUser.id && (
                      <RevokeUserButton userId={user.id} userName={user.name} />
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
