"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

export type SidebarNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type SidebarShellProps = {
  navItems: SidebarNavItem[];
  userName: string;
  locationLabel?: string;
  locationValue?: string;
  locationSwitcher?: ReactNode;
};

function Sidebar({
  navItems,
  userName,
  locationLabel,
  locationValue,
  locationSwitcher,
}: SidebarShellProps) {
  const pathname = usePathname();

  // Escolhe o item cujo href mais específico corresponde à rota atual, para
  // evitar que um href prefixo de outro fique destacado ao mesmo tempo.
  const activeHref = navItems
    .filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-[#0B2545] text-white">
      <div className="flex items-center justify-center p-4">
        <Image
          src="/logo-dark.png"
          alt="FideDizi — Tecnologia a serviço da fé"
          width={1264}
          height={843}
          className="h-auto w-[13.2rem]"
          priority
          unoptimized
        />
      </div>

      {locationSwitcher ?? (
        <div className="px-4 pb-4">
          <p className="text-xs text-white/50">{locationLabel}</p>
          <div className="mt-1 rounded-md bg-white/10 px-3 py-2 text-sm">
            <span className="block truncate">{locationValue}</span>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = item.href === activeHref;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-[#C9A227] text-[#0B2545]"
                      : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex items-center justify-between gap-2 border-t border-white/10 p-4">
        <span className="truncate text-sm text-white/70">{userName}</span>
        <LogoutButton />
      </div>
    </aside>
  );
}

export function SidebarPageLayout({
  children,
  ...sidebarProps
}: SidebarShellProps & { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar {...sidebarProps} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
