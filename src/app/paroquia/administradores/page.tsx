import { Shield, Crown } from "lucide-react";
import { requireParoquiaContext } from "@/lib/selected-institution";
import { listParoquiaAdmins } from "@/lib/queries/admins";
import { NewAdminModal } from "./new-admin-modal";
import { AdminCard } from "./admin-card";
import { ResendInviteButton } from "./resend-invite-button";

export default async function AdministradoresPage() {
  const { user, institution } = await requireParoquiaContext();

  if (!user.isOwner) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Apenas o proprietário (pároco) pode gerenciar administradores.
      </div>
    );
  }

  const admins = await listParoquiaAdmins(institution.id);
  const owner = admins.find((admin) => admin.isOwner);
  const others = admins.filter((admin) => !admin.isOwner);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-[#0B2545]">
            <Shield className="h-5 w-5 text-[#C9A227]" />
            Gestão de Usuários
          </h2>
          <p className="text-sm text-slate-500">
            Como pároco (proprietário), você pode conceder e revogar
            permissões administrativas.
          </p>
        </div>
        <NewAdminModal />
      </div>

      {owner && (
        <div className="flex items-center justify-between gap-4 rounded-xl bg-[#0B2545] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#C9A227] text-[#0B2545]">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{owner.name}</span>
                <span className="rounded-full bg-[#C9A227] px-2 py-0.5 text-xs font-semibold text-[#0B2545]">
                  Proprietário
                </span>
                {owner.passwordSetupToken && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Pendente
                  </span>
                )}
              </div>
              <p className="text-sm text-white/70">
                Acesso total · Não pode ser revogado
              </p>
            </div>
          </div>
          {owner.passwordSetupToken && (
            <ResendInviteButton userId={owner.id} dark />
          )}
        </div>
      )}

      {others.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
          Nenhum administrador cadastrado ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {others.map((admin) => (
            <AdminCard
              key={admin.id}
              admin={{
                id: admin.id,
                name: admin.name,
                email: admin.email,
                permissions: admin.permissions,
                pending: !!admin.passwordSetupToken,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
