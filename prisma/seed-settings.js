const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const s = await p.systemSettings.findFirst();
  if (!s) {
    await p.systemSettings.create({
      data: {
        ccpNumber: "0000000000 00",
        ccpHolder: "اسم صاحب الحساب",
        ccpPhone: "0500000000",
        monthlyPrice: 2000,
        yearlyPrice: 20000,
      },
    });
    console.log("Settings created");
  } else {
    console.log("Settings exist:", s.id);
  }
}

main().catch(console.error).finally(() => p.$disconnect());
