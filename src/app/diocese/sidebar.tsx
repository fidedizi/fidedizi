"use client";

import type { ReactNode } from "react";
import { LayoutDashboard, Church } from "lucide-react";
import { SidebarPageLayout } from "@/components/sidebar-shell";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/diocese", icon: LayoutDashboard },
  {
    label: "Paróquias Vinculadas",
    href: "/diocese/paroquias",
    icon: Church,
  },
];

export function DioceseSidebar({
  institutionName,
  userName,
  children,
}: {
  institutionName: string;
  userName: string;
  children: ReactNode;
}) {
  return (
    <SidebarPageLayout
      navItems={NAV_ITEMS}
      locationLabel="Local"
      locationValue={institutionName}
      userName={userName}
    >
      {children}
    </SidebarPageLayout>
  );
}
