"use client";

import { Check } from "lucide-react";
import { togglePermission } from "@/app/actions/admins";
import type { PermissionModule } from "@/generated/prisma/client";

export function PermissionToggle({
  userId,
  module,
  label,
  active,
}: {
  userId: string;
  module: PermissionModule;
  label: string;
  active: boolean;
}) {
  const toggleForUser = togglePermission.bind(null, userId, module);

  return (
    <form action={toggleForUser} className="flex items-center gap-1.5">
      <button
        type="submit"
        aria-label={`Alternar acesso a ${label}`}
        aria-pressed={active}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
          active
            ? "border-[#0B2545] bg-[#0B2545] text-white"
            : "border-slate-300 text-transparent hover:border-slate-400"
        }`}
      >
        <Check className="h-3 w-3" />
      </button>
      <span className="text-sm text-slate-600">{label}</span>
    </form>
  );
}
