import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
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
        <LoginForm />
      </div>
    </div>
  );
}
