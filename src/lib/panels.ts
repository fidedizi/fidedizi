import { UserScope } from "@/generated/prisma/client";

// Cada escopo de usuário tem um painel raiz correspondente (seção 4 da spec).
export const SCOPE_PANEL_PATH: Record<UserScope, string> = {
  [UserScope.MASTER]: "/master",
  [UserScope.DIOCESE]: "/diocese",
  [UserScope.PAROQUIA]: "/paroquia",
};

export function panelPathForScope(scope: UserScope) {
  return SCOPE_PANEL_PATH[scope];
}
