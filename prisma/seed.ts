import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserScope, InstitutionType } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("senha123", 10);

  const arquidiocese = await prisma.institution.upsert({
    where: { cnpj: "00000000000191" },
    update: {},
    create: {
      type: InstitutionType.ARQUIDIOCESE,
      name: "Arquidiocese de São Paulo",
      cnpj: "00000000000191",
      status: "ACTIVE",
    },
  });

  const paroquia = await prisma.institution.upsert({
    where: { cnpj: "00000000000272" },
    update: {},
    create: {
      type: InstitutionType.PAROQUIA,
      name: "Paróquia Nossa Senhora Aparecida",
      cnpj: "00000000000272",
      status: "ACTIVE",
      parentId: arquidiocese.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "master@fidedizi.com.br" },
    update: {},
    create: {
      name: "CEO FideDizi",
      email: "master@fidedizi.com.br",
      passwordHash,
      scope: UserScope.MASTER,
    },
  });

  await prisma.user.upsert({
    where: { email: "diocese@fidedizi.com.br" },
    update: {},
    create: {
      name: "Ecônomo Diocesano",
      email: "diocese@fidedizi.com.br",
      passwordHash,
      scope: UserScope.DIOCESE,
      institutionId: arquidiocese.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "paroquia@fidedizi.com.br" },
    update: {},
    create: {
      name: "Pároco",
      email: "paroquia@fidedizi.com.br",
      passwordHash,
      scope: UserScope.PAROQUIA,
      isOwner: true,
      institutionId: paroquia.id,
    },
  });

  console.log("Seed concluído. Senha para todos os usuários: senha123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
