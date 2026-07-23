"use client";

import { Users2, Mail, Lock } from "lucide-react";
import { revokeAdmin } from "@/app/actions/admins";
import { PERMISSION_MODULE_LABELS } from "@/lib/labels";
import { PermissionToggle } from "./permission-toggle";
import { ResendInviteButton } from "./resend-invite-button";
import type { PermissionModule } from "@/generated/prisma/client";

const MODULES = Object.keys(PERMISSION_MODULE_LABELS) as PermissionModule[];

export function AdminCard({
  admin,
}: {
  admin: {
    id: string;
    name: string;
    email: string;
    permissions: { module: PermissionModule; canView: boolean }[];
    pending: boolean;
  };
}) {
  const revokeAdminWithId = revokeAdmin.bind(null, admin.id);
  const activeModules = new Set(
    admin.permissions.filter((p) => p.canView).map((p) => p.module),
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5E9D6] text-[#0B2545]">
            <Users2 className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-800">{admin.name}</p>
              {admin.pending && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Pendente
                </span>
              )}
            </div>
            <p className="flex items-center gap-1 text-sm text-slate-500">
              <Mail className="h-3.5 w-3.5" /> {admin.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {admin.pending && <ResendInviteButton userId={admin.id} />}
          <form
            action={revokeAdminWithId}
            onSubmit={(e) => {
              if (
                !confirm(
                  `Tem certeza que deseja revogar o acesso de "${admin.name}"? Ele(a) não poderá mais entrar no sistema.`,
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <Lock className="h-3.5 w-3.5" /> Revogar
            </button>
          </form>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Níveis de Acesso
        </p>
        <div className="flex flex-wrap gap-4">
          {MODULES.map((module) => (
            <PermissionToggle
              key={module}
              userId={admin.id}
              module={module}
              label={PERMISSION_MODULE_LABELS[module]}
              active={activeModules.has(module)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
