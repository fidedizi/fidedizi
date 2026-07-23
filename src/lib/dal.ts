import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { decrypt, readSessionCookie } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { UserScope } from "@/generated/prisma/client";

export const verifySession = cache(async () => {
  const session = await decrypt(await readSessionCookie());

  if (!session?.userId) {
    redirect("/login");
  }

  return session;
});

export const getCurrentUser = cache(async () => {
  const session = await verifySession();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      scope: true,
      isOwner: true,
      institutionId: true,
      institution: { select: { id: true, name: true, type: true } },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return user;
});

// Chamado tanto no layout quanto na page de cada painel: o Next.js pode
// renderizar layout e page em paralelo, então o redirect do layout sozinho
// não garante que a page nunca rode com institutionId nulo.
export async function requireScope(scope: UserScope) {
  const user = await getCurrentUser();

  if (user.scope !== scope) {
    redirect("/login");
  }

  if (scope !== UserScope.MASTER && !user.institutionId) {
    redirect("/login");
  }

  return user;
}
