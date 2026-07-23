import type { ReactNode } from "react";
import { requireScope } from "@/lib/dal";
import { UserScope } from "@/generated/prisma/client";
import { DioceseSidebar } from "./sidebar";

export default async function DioceseLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireScope(UserScope.DIOCESE);

  return (
    <DioceseSidebar
      institutionName={user.institution?.name ?? "Painel Diocesano"}
      userName={user.name}
    >
      {children}
    </DioceseSidebar>
  );
}
