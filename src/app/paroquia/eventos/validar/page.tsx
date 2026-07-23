import { requireScope } from "@/lib/dal";
import { requirePermission } from "@/lib/permissions";
import { UserScope, PermissionModule } from "@/generated/prisma/client";
import { TicketScanner } from "./ticket-scanner";

export default async function ValidarIngressoPage() {
  const user = await requireScope(UserScope.PAROQUIA);
  await requirePermission(user, PermissionModule.AGENDA);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-slate-800">
        Validação de Ingressos
      </h2>
      <TicketScanner />
    </div>
  );
}
