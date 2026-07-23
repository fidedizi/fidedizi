import { requireScope } from "@/lib/dal";
import { requirePermission } from "@/lib/permissions";
import { UserScope, PermissionModule } from "@/generated/prisma/client";
import { listSubUnitsWithStats } from "@/lib/queries/sub-units";
import { NewSubUnitModal } from "./sub-unit-form-modal";
import { SubUnitCard } from "./sub-unit-card";

function currentMonthLabel() {
  const label = new Date().toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default async function CapelasPage() {
  const user = await requireScope(UserScope.PAROQUIA);
  await requirePermission(user, PermissionModule.CONFIGURACOES);
  const subUnits = await listSubUnitsWithStats(user.institutionId!);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Capelas &amp; Comunidades
          </h2>
          <p className="text-sm text-slate-500">
            Sub-unidades com gestão financeira própria — {currentMonthLabel()}
          </p>
        </div>
        <NewSubUnitModal />
      </div>

      {subUnits.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-400">
          Nenhuma capela ou comunidade cadastrada ainda.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subUnits.map((subUnit) => (
          <SubUnitCard key={subUnit.id} subUnit={subUnit} />
        ))}
      </div>
    </div>
  );
}
