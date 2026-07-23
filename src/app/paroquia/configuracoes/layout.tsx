import type { ReactNode } from "react";
import { requireScope } from "@/lib/dal";
import { requirePermission } from "@/lib/permissions";
import { UserScope, PermissionModule } from "@/generated/prisma/client";

export default async function ConfiguracoesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireScope(UserScope.PAROQUIA);
  await requirePermission(user, PermissionModule.CONFIGURACOES);

  return children;
}
