import { Home, MapPin } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { formatCNPJ } from "@/lib/cnpj";
import { INSTITUTION_TYPE_LABELS } from "@/lib/labels";
import { EditSubUnitModal } from "./sub-unit-form-modal";

type SubUnitCardProps = {
  subUnit: {
    id: string;
    name: string;
    cnpj: string;
    type: string;
    status: string;
    address: string | null;
    city: string | null;
    state: string | null;
    contactName: string | null;
    phone: string | null;
    email: string | null;
    monthlyGross: number;
    members: number;
    contributors: number;
  };
};

export function SubUnitCard({ subUnit }: SubUnitCardProps) {
  const location = [subUnit.address, subUnit.city, subUnit.state]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100">
            <Home className="h-5 w-5 text-[#0B2545]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              {subUnit.name}
            </h3>
            <span className="mt-1 inline-block rounded-full border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {INSTITUTION_TYPE_LABELS[subUnit.type]}
            </span>
          </div>
        </div>
        <EditSubUnitModal
          subUnit={{
            id: subUnit.id,
            name: subUnit.name,
            cnpj: formatCNPJ(subUnit.cnpj),
            type: subUnit.type,
            address: subUnit.address ?? "",
            city: subUnit.city ?? "",
            state: subUnit.state ?? "",
            contactName: subUnit.contactName ?? "",
            phone: subUnit.phone ?? "",
            email: subUnit.email ?? "",
            status: subUnit.status,
          }}
        />
      </div>

      {location && (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <MapPin className="h-4 w-4 text-slate-400" />
          {location}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
        <div>
          <p className="text-xs text-slate-500">Arrecadado (mês)</p>
          <p className="text-sm font-semibold text-slate-800">
            {formatBRL(subUnit.monthlyGross)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Fiéis / Dizimistas</p>
          <p className="text-sm font-semibold text-slate-800">
            {subUnit.members} / {subUnit.contributors}
          </p>
        </div>
      </div>
    </div>
  );
}
