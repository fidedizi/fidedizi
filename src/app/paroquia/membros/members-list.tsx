"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Phone, Mail } from "lucide-react";
import { EditMemberModal } from "./member-modal";
import { DeleteMemberButton } from "./delete-member-button";
import { MemberRelationshipsModal } from "./member-relationships-modal";

type FlagOption = { id: string; name: string };

export type MemberListItem = {
  id: string;
  name: string;
  whatsapp: string;
  whatsappDisplay: string;
  email: string;
  birthDate: string;
  address: string;
  donationMethod: string;
  isActiveTither: boolean;
  notes: string;
  flags: FlagOption[];
};

export function MembersList({
  members,
  flagOptions,
}: {
  members: MemberListItem[];
  flagOptions: FlagOption[];
}) {
  const [query, setQuery] = useState("");
  const [flagFilter, setFlagFilter] = useState("");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return members.filter((member) => {
      const matchesQuery =
        !normalizedQuery ||
        member.name.toLowerCase().includes(normalizedQuery) ||
        member.email.toLowerCase().includes(normalizedQuery);
      const matchesFlag =
        !flagFilter || member.flags.some((flag) => flag.id === flagFilter);
      return matchesQuery && matchesFlag;
    });
  }, [members, query, flagFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={flagFilter}
          onChange={(e) => setFlagFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:w-56"
        >
          <option value="">Filtrar por etiqueta</option>
          {flagOptions.map((flag) => (
            <option key={flag.id} value={flag.id}>
              {flag.name}
            </option>
          ))}
        </select>
      </div>

      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-slate-400">
            Nenhum fiel encontrado.
          </p>
        )}
        {filtered.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between gap-4 p-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0B2545] text-sm font-semibold text-white">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/paroquia/membros/${member.id}`}
                    className="font-semibold text-slate-800 hover:underline"
                  >
                    {member.name}
                  </Link>
                  {member.isActiveTither && (
                    <span className="rounded-full bg-[#C9A227] px-2 py-0.5 text-xs font-semibold text-[#0B2545]">
                      Dizimista
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {member.whatsappDisplay}
                  </span>
                  {member.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" /> {member.email}
                    </span>
                  )}
                </div>
                {member.flags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {member.flags.map((flag) => (
                      <span
                        key={flag.id}
                        className={`rounded-full border px-2 py-0.5 text-xs ${
                          flag.name === "Em atraso"
                            ? "border-red-300 text-red-600"
                            : "border-slate-300 text-slate-600"
                        }`}
                      >
                        {flag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <MemberRelationshipsModal
                memberId={member.id}
                memberName={member.name}
              />
              <EditMemberModal
                member={{
                  id: member.id,
                  name: member.name,
                  whatsapp: member.whatsapp,
                  email: member.email,
                  birthDate: member.birthDate,
                  address: member.address,
                  donationMethod: member.donationMethod,
                  isActiveTither: member.isActiveTither,
                  notes: member.notes,
                  flagIds: member.flags.map((f) => f.id),
                }}
                flagOptions={flagOptions}
              />
              <DeleteMemberButton memberId={member.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
