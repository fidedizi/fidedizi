"use client";

import { useActionState } from "react";
import { activateAccount } from "@/app/actions/activate-account";

export function ActivateAccountForm({ token }: { token: string }) {
  const activateWithToken = activateAccount.bind(null, token);
  const [state, action, pending] = useActionState(activateWithToken, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Nova senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0B2545] focus:outline-none focus:ring-1 focus:ring-[#0B2545]"
        />
        {state?.errors?.password && (
          <p className="text-sm text-red-600">{state.errors.password[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="confirmPassword"
          className="text-sm font-medium text-slate-700"
        >
          Confirmar nova senha
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0B2545] focus:outline-none focus:ring-1 focus:ring-[#0B2545]"
        />
        {state?.errors?.confirmPassword && (
          <p className="text-sm text-red-600">
            {state.errors.confirmPassword[0]}
          </p>
        )}
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0B2545]/90 disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Ativar conta"}
      </button>
    </form>
  );
}
