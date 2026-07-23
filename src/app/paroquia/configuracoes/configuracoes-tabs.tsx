"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/paroquia/configuracoes", label: "Pastorais e Movimentos" },
  { href: "/paroquia/configuracoes/capelas", label: "Capelas/Comunidades" },
];

export function ConfiguracoesTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 border-b border-slate-200">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
              active
                ? "border-[#0B2545] text-[#0B2545]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
