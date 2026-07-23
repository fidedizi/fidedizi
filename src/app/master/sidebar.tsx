"use client";

import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Building2,
  Percent,
  Landmark,
  Users2,
} from "lucide-react";
import { SidebarPageLayout } from "@/components/sidebar-shell";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/master", icon: LayoutDashboard },
  {
    label: "Gestão de Licenciamento",
    href: "/master/licenciamento",
    icon: Building2,
  },
  { label: "Usuários", href: "/master/usuarios", icon: Users2 },
  { label: "Split Parametrizável", href: "/master/split", icon: Percent },
  {
    label: "Onboarding de Recebedores",
    href: "/master/recebedores",
    icon: Landmark,
  },
];

export function MasterSidebar({
  userName,
  children,
}: {
  userName: string;
  children: ReactNode;
}) {
  return (
    <SidebarPageLayout
      navItems={NAV_ITEMS}
      locationLabel="Escopo"
      locationValue="Painel Master"
      userName={userName}
    >
      {children}
    </SidebarPageLayout>
  );
}
