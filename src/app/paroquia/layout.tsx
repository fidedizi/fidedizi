import type { ReactNode } from "react";
import { requireScope } from "@/lib/dal";
import { UserScope } from "@/generated/prisma/client";
import { getSelectedInstitution } from "@/lib/selected-institution";
import { listSelectableLocations } from "@/lib/queries/sub-units";
import { getPermittedModules } from "@/lib/permissions";
import { ParoquiaSidebar } from "./sidebar";

export default async function ParoquiaLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireScope(UserScope.PAROQUIA);

  const [selected, locations, permittedModules] = await Promise.all([
    getSelectedInstitution(user.institutionId!),
    listSelectableLocations(user.institutionId!),
    getPermittedModules(user),
  ]);

  return (
    <ParoquiaSidebar
      selectedLocation={{ id: selected.id, name: selected.name }}
      locations={locations}
      userName={user.name}
      isOwner={user.isOwner}
      permittedModules={[...permittedModules]}
    >
      {children}
    </ParoquiaSidebar>
  );
}
