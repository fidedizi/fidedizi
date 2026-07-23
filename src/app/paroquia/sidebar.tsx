"use client";

import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Megaphone,
  CalendarDays,
  Home,
  MessageSquare,
  Settings,
  ChevronDown,
  FileText,
  ShieldCheck,
  HandHeart,
  Church,
} from "lucide-react";
import { SidebarPageLayout } from "@/components/sidebar-shell";
import { selectInstitution } from "@/app/actions/location";

const BASE_NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/paroquia",
    icon: LayoutDashboard,
    module: "DASHBOARD",
  },
  { label: "Membros", href: "/paroquia/membros", icon: Users, module: "MEMBROS" },
  {
    label: "Financeiro",
    href: "/paroquia/financeiro",
    icon: Wallet,
    module: "FINANCEIRO",
  },
  {
    label: "Relatórios",
    href: "/paroquia/relatorios",
    icon: FileText,
    module: "FINANCEIRO",
  },
  {
    label: "Campanhas",
    href: "/paroquia/campanhas",
    icon: Megaphone,
    module: "CAMPANHAS",
  },
  {
    label: "Eventos & Festas",
    href: "/paroquia/eventos",
    icon: CalendarDays,
    module: "AGENDA",
  },
  {
    label: "Horários de Missas",
    href: "/paroquia/horarios-missas",
    icon: Church,
    module: "AGENDA",
  },
  {
    label: "Capelas",
    href: "/paroquia/configuracoes/capelas",
    icon: Home,
    module: "CONFIGURACOES",
  },
  {
    label: "Personalização Mensagens",
    href: "/paroquia/avisos",
    icon: MessageSquare,
    module: "AVISOS",
  },
  {
    label: "Pedidos de Oração",
    href: "/paroquia/pedidos-oracao",
    icon: HandHeart,
    module: "AVISOS",
  },
  {
    label: "Configurações",
    href: "/paroquia/configuracoes",
    icon: Settings,
    module: "CONFIGURACOES",
  },
];

const ADMIN_NAV_ITEM = {
  label: "Usuários",
  href: "/paroquia/administradores",
  icon: ShieldCheck,
};

type Location = { id: string; name: string };

function LocationSwitcher({
  selectedLocation,
  locations,
}: {
  selectedLocation: Location;
  locations: Location[];
}) {
  const [open, setOpen] = useState(false);

  if (locations.length <= 1) {
    return (
      <div className="px-4 pb-4">
        <p className="text-xs text-white/50">Local</p>
        <div className="mt-1 rounded-md bg-white/10 px-3 py-2 text-sm">
          <span className="block truncate">{selectedLocation.name}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative px-4 pb-4">
      <p className="text-xs text-white/50">Local</p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-1 flex w-full items-center justify-between gap-2 rounded-md bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
      >
        <span className="truncate">{selectedLocation.name}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-4 right-4 z-10 mt-1 max-h-64 overflow-y-auto rounded-md bg-white p-1 text-slate-800 shadow-xl">
          {locations.map((location) => (
            <form
              key={location.id}
              action={async () => {
                setOpen(false);
                await selectInstitution(location.id);
              }}
            >
              <button
                type="submit"
                className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-slate-100 ${
                  location.id === selectedLocation.id
                    ? "bg-slate-100 font-medium"
                    : ""
                }`}
              >
                <Home className="h-4 w-4 shrink-0 text-[#0B2545]" />
                <span className="truncate">{location.name}</span>
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}

export function ParoquiaSidebar({
  selectedLocation,
  locations,
  userName,
  isOwner,
  permittedModules,
  children,
}: {
  selectedLocation: Location;
  locations: Location[];
  userName: string;
  isOwner: boolean;
  permittedModules: string[];
  children: ReactNode;
}) {
  const allowed = new Set(permittedModules);
  const visibleItems = BASE_NAV_ITEMS.filter(
    (item) => !item.module || allowed.has(item.module),
  );
  const navItems = isOwner ? [...visibleItems, ADMIN_NAV_ITEM] : visibleItems;

  return (
    <SidebarPageLayout
      navItems={navItems}
      userName={userName}
      locationSwitcher={
        <LocationSwitcher
          selectedLocation={selectedLocation}
          locations={locations}
        />
      }
    >
      {children}
    </SidebarPageLayout>
  );
}
