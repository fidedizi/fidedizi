import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ActivateAccountForm } from "./activate-account-form";

export default async function AtivarContaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const user = token
    ? await prisma.user.findUnique({ where: { passwordSetupToken: token } })
    : null;

  const isValid =
    !!user &&
    !!user.passwordSetupTokenExpiresAt &&
    user.passwordSetupTokenExpiresAt > new Date();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo.png"
            alt="FideDizi — Tecnologia a serviço da fé"
            width={1264}
            height={843}
            className="h-auto w-64"
            priority
            unoptimized
          />
        </div>

        {isValid && token ? (
          <>
            <h2 className="mb-1 text-lg font-semibold text-slate-800">
              Bem-vindo(a), {user.name.split(" ")[0]}!
            </h2>
            <p className="mb-6 text-sm text-slate-500">
              Cadastre sua senha para ativar o acesso ao FideDizi.
            </p>
            <ActivateAccountForm token={token} />
          </>
        ) : (
          <>
            <h2 className="mb-1 text-lg font-semibold text-slate-800">
              Link inválido ou expirado
            </h2>
            <p className="text-sm text-slate-500">
              Solicite um novo cadastro ao administrador responsável.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
