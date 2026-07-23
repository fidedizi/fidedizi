"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireScope } from "@/lib/dal";
import { UserScope } from "@/generated/prisma/client";
import { SELECTED_INSTITUTION_COOKIE } from "@/lib/selected-institution";

export async function selectInstitution(institutionId: string) {
  const user = await requireScope(UserScope.PAROQUIA);

  const isValid =
    institutionId === user.institutionId ||
    (await prisma.institution.findFirst({
      where: { id: institutionId, parentId: user.institutionId! },
      select: { id: true },
    })) !== null;

  if (!isValid) return;

  const cookieStore = await cookies();
  cookieStore.set(SELECTED_INSTITUTION_COOKIE, institutionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath("/paroquia");
}
