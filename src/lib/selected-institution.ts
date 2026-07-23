import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireScope } from "@/lib/dal";
import { UserScope } from "@/generated/prisma/client";

export const SELECTED_INSTITUTION_COOKIE = "fidedizi_selected_institution";

// Retorna a instituição atualmente selecionada no seletor de "Local" do
// menu (a própria paróquia, ou uma capela/comunidade filha dela). Sempre
// valida contra o banco para não confiar cegamente num cookie adulterado.
export async function getSelectedInstitution(paroquiaId: string) {
  const cookieStore = await cookies();
  const selectedId = cookieStore.get(SELECTED_INSTITUTION_COOKIE)?.value;

  if (selectedId && selectedId !== paroquiaId) {
    const subUnit = await prisma.institution.findFirst({
      where: { id: selectedId, parentId: paroquiaId },
      select: { id: true, name: true, type: true, pixKey: true, phone: true },
    });
    if (subUnit) return subUnit;
  }

  const parish = await prisma.institution.findUnique({
    where: { id: paroquiaId },
    select: { id: true, name: true, type: true, pixKey: true, phone: true },
  });

  return parish!;
}

// Ponto único usado por todas as páginas/actions do painel Paróquia: resolve
// o usuário logado e a instituição que deve ser usada para consultas e
// gravações (a paróquia em si, ou a capela/comunidade selecionada no menu).
export async function requireParoquiaContext() {
  const user = await requireScope(UserScope.PAROQUIA);
  const institution = await getSelectedInstitution(user.institutionId!);
  return { user, institution };
}
