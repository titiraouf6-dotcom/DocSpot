import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          ccpNumber: "",
          ccpHolder: "",
          ccpPhone: "",
          monthlyPrice: 2000,
          yearlyPrice: 20000,
        },
      });
    }
    return NextResponse.json({
      ccpNumber: settings.ccpNumber,
      ccpHolder: settings.ccpHolder,
      ccpPhone: settings.ccpPhone,
      monthlyPrice: settings.monthlyPrice,
      yearlyPrice: settings.yearlyPrice,
    });
  } catch (error) {
    return NextResponse.json({ error: "فشل في جلب معلومات الدفع" }, { status: 500 });
  }
}
