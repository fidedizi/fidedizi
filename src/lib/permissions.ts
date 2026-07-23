import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PermissionModule } from "@/generated/prisma/client";

type PermissionUser = { id: string; isOwner: boolean };

export async function userHasPermission(
  user: PermissionUser,
  module: PermissionModule,
) {
  if (user.isOwner) return true;

  const permission = await prisma.userPermission.findUnique({
    where: { userId_module: { userId: user.id, module } },
  });

  return permission?.canView ?? false;
}

// Chamado tanto no layout quanto na page de cada módulo, pelo mesmo motivo de
// requireScope: layout e page podem renderizar em paralelo no Next.js.
export async function requirePermission(
  user: PermissionUser,
  module: PermissionModule,
) {
  const allowed = await userHasPermission(user, module);
  if (!allowed) {
    redirect("/paroquia");
  }
}

export async function getPermittedModules(user: PermissionUser) {
  if (user.isOwner) {
    return new Set(Object.values(PermissionModule));
  }

  const permissions = await prisma.userPermission.findMany({
    where: { userId: user.id, canView: true },
    select: { module: true },
  });

  return new Set(permissions.map((p) => p.module));
}

// Ordem de preferência para onde mandar o admin quando ele não tem acesso ao
// Dashboard: o primeiro módulo liberado nessa lista vira a página inicial dele.
const FALLBACK_MODULE_ORDER: PermissionModule[] = [
  PermissionModule.MEMBROS,
  PermissionModule.FINANCEIRO,
  PermissionModule.CAMPANHAS,
  PermissionModule.AGENDA,
  PermissionModule.CONFIGURACOES,
  PermissionModule.AVISOS,
];

const MODULE_ROUTES: Record<PermissionModule, string> = {
  DASHBOARD: "/paroquia",
  MEMBROS: "/paroquia/membros",
  FINANCEIRO: "/paroquia/financeiro",
  CAMPANHAS: "/paroquia/campanhas",
  AGENDA: "/paroquia/eventos",
  CONFIGURACOES: "/paroquia/configuracoes/capelas",
  AVISOS: "/paroquia/avisos",
};

// Chamado só pela própria página do Dashboard. Diferente de requirePermission,
// não pode redirecionar para "/paroquia" em caso de falha (seria um loop, já
// que o Dashboard é justamente essa rota) — em vez disso manda o admin para o
// primeiro módulo que ele tiver liberado, ou devolve false para a página
// mostrar uma mensagem de acesso restrito.
export async function requireDashboardAccess(user: PermissionUser) {
  const allowed = await userHasPermission(user, PermissionModule.DASHBOARD);
  if (allowed) return true;

  const permitted = await getPermittedModules(user);
  const fallback = FALLBACK_MODULE_ORDER.find((module) => permitted.has(module));

  if (fallback) {
    redirect(MODULE_ROUTES[fallback]);
  }

  return false;
}
