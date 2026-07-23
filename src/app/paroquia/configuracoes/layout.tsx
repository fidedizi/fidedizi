import type { ReactNode } from "react";
import { requireScope } from "@/lib/dal";
import { requirePermission } from "@/lib/permissions";
import { UserScope, PermissionModule } from "@/generated/prisma/client";
import { ConfiguracoesTabs } from "./configuracoes-tabs";

export default async function ConfiguracoesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireScope(UserScope.PAROQUIA);
  await requirePermission(user, PermissionModule.CONFIGURACOES);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-slate-800">Configurações</h2>
      <ConfiguracoesTabs />
      {children}
    </div>
  );
}
