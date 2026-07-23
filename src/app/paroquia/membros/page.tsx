import { requireParoquiaContext } from "@/lib/selected-institution";
import { requirePermission } from "@/lib/permissions";
import { PermissionModule } from "@/generated/prisma/client";
import { listFlags, listMembers } from "@/lib/queries/members";
import { formatWhatsApp, stripCountryCode } from "@/lib/whatsapp";
import { OVERDUE_FLAG_NAME } from "@/lib/overdue";
import { NewMemberModal } from "./member-modal";
import { MembersList } from "./members-list";
import {
  IdentifyOverdueButton,
  RemindOverdueButton,
} from "./overdue-action-buttons";

export default async function MembrosPage() {
  const { user, institution } = await requireParoquiaContext();
  await requirePermission(user, PermissionModule.MEMBROS);

  const [flags, members] = await Promise.all([
    listFlags(institution.id),
    listMembers(institution.id),
  ]);

  const flagOptions = flags
    .filter((flag) => flag.name !== OVERDUE_FLAG_NAME)
    .map((flag) => ({ id: flag.id, name: flag.name }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Membros</h2>
          <p className="text-sm text-slate-500">
            {members.length} membros cadastrados
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RemindOverdueButton />
          <IdentifyOverdueButton />
          <NewMemberModal flagOptions={flagOptions} />
        </div>
      </div>

      <MembersList
        flagOptions={flagOptions}
        members={members.map((member) => ({
          id: member.id,
          name: member.name,
          whatsapp: stripCountryCode(member.whatsapp),
          whatsappDisplay: formatWhatsApp(member.whatsapp),
          email: member.email ?? "",
          birthDate: member.birthDate
            ? member.birthDate.toISOString().slice(0, 10)
            : "",
          address: member.address ?? "",
          donationMethod: member.donationMethod,
          isActiveTither: member.isActiveTither,
          notes: member.notes ?? "",
          flags: member.flags.map((mf) => ({
            id: mf.flag.id,
            name: mf.flag.name,
          })),
        }))}
      />
    </div>
  );
}
