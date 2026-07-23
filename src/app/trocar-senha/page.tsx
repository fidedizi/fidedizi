import Image from "next/image";
import { ChangePasswordForm } from "./change-password-form";

export default function TrocarSenhaPage() {
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
        <h2 className="mb-1 text-lg font-semibold text-slate-800">
          Defina uma nova senha
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          Por segurança, você precisa trocar a senha provisória antes de
          continuar.
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
