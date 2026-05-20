import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL is not set in environment variables");
  }

  if (!adminPassword) {
    throw new Error("ADMIN_PASSWORD is not set in environment variables");
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "مدير النظام",
      passwordHash,
      phone: "0500000000",
      role: "ADMIN",
    },
    create: {
      email: adminEmail,
      name: "مدير النظام",
      passwordHash,
      role: "ADMIN",
      phone: "0500000000",
    },
  });

  // Create default system settings
  const settings = await prisma.systemSettings.findFirst();
  if (!settings) {
    await prisma.systemSettings.create({
      data: {
        ccpNumber: "0000000000 00",
        ccpHolder: "اسم صاحب الحساب",
        ccpPhone: "0500000000",
        monthlyPrice: 2000,
        yearlyPrice: 20000,
      },
    });
  }
}

main()
  .catch(() => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
