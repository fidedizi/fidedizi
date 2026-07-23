import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";
import { panelPathForScope } from "@/lib/panels";
import { prisma } from "@/lib/prisma";
import type { UserScope } from "@/generated/prisma/client";

const SESSION_COOKIE = "fidedizi_session";

const PANEL_PREFIXES = ["/master", "/diocese", "/paroquia"];
const CHANGE_PASSWORD_ROUTE = "/trocar-senha";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPanelRoute = PANEL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isLoginRoute = pathname === "/login";
  const isChangePasswordRoute = pathname === CHANGE_PASSWORD_ROUTE;

  const session = await decrypt(req.cookies.get(SESSION_COOKIE)?.value);

  // O JWT sozinho não garante que o usuário ainda existe (ex.: um
  // administrador revogado enquanto a sessão dele ainda estava ativa) —
  // sem essa checagem no banco, a page redireciona para /login mas o
  // middleware vê o cookie "válido" e manda de volta para o painel,
  // criando um loop infinito.
  let user: { scope: UserScope; mustChangePassword: boolean } | null = null;
  if (session?.userId) {
    user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { scope: true, mustChangePassword: true },
    });
  }

  const hasStaleSession = !!session?.userId && !user;

  if ((isPanelRoute || isChangePasswordRoute || pathname === "/") && !user) {
    const response = NextResponse.redirect(new URL("/login", req.nextUrl));
    if (hasStaleSession) {
      response.cookies.delete(SESSION_COOKIE);
    }
    return response;
  }

  // Usuário com senha provisória precisa trocá-la antes de acessar qualquer
  // outra rota do sistema (login e logout continuam liberados).
  if (user?.mustChangePassword && !isChangePasswordRoute) {
    return NextResponse.redirect(new URL(CHANGE_PASSWORD_ROUTE, req.nextUrl));
  }

  if (user && !user.mustChangePassword && (isLoginRoute || pathname === "/")) {
    return NextResponse.redirect(
      new URL(panelPathForScope(user.scope), req.nextUrl),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
