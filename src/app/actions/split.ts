"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireScope } from "@/lib/dal";
import { UserScope } from "@/generated/prisma/client";
import {
  SplitConfigFormSchema,
  type SplitConfigFormState,
} from "@/lib/definitions";

export async function upsertSplitConfig(
  _state: SplitConfigFormState,
  formData: FormData,
) {
  await requireScope(UserScope.MASTER);

  const validatedFields = SplitConfigFormSchema.safeParse({
    institutionId: formData.get("institutionId"),
    commissionRate: formData.get("commissionRate"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { institutionId, commissionRate } = validatedFields.data;

  await prisma.splitConfig.upsert({
    where: { institutionId },
    update: { commissionRate },
    create: { institutionId, commissionRate },
  });

  revalidatePath("/master/split");

  return { message: "Percentual de comissão atualizado com sucesso." };
}
