import type { ReactNode } from "react";
import { requireScope } from "@/lib/dal";
import { UserScope } from "@/generated/prisma/client";
import { MasterSidebar } from "./sidebar";

export default async function MasterLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireScope(UserScope.MASTER);

  return <MasterSidebar userName={user.name}>{children}</MasterSidebar>;
}
