import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          ccpNumber: "",
          ccpHolder: "",
          ccpPhone: "",
          monthlyPrice: 2000,
          yearlyPrice: 20000,
          supportEmail: "contact@docspot.dz",
        } as any,
      });
    }
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    let settings = await prisma.systemSettings.findFirst();

    if (settings) {
      await prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
          ccpNumber: body.ccpNumber ?? settings.ccpNumber,
          ccpHolder: body.ccpHolder ?? settings.ccpHolder,
          ccpPhone: body.ccpPhone ?? settings.ccpPhone,
          monthlyPrice: body.monthlyPrice ?? settings.monthlyPrice,
          yearlyPrice: body.yearlyPrice ?? settings.yearlyPrice,
          supportEmail: body.supportEmail ?? (settings as any).supportEmail,
        } as any,
      });
    } else {
      await prisma.systemSettings.create({
        data: {
          ccpNumber: body.ccpNumber || "",
          ccpHolder: body.ccpHolder || "",
          ccpPhone: body.ccpPhone || "",
          monthlyPrice: body.monthlyPrice || 2000,
          yearlyPrice: body.yearlyPrice || 20000,
          supportEmail: body.supportEmail || "contact@docspot.dz",
        } as any,
      });
    }

    await prisma.adminLog.create({
      data: {
        adminId: (session.user as any).id,
        action: "settings.update",
        details: body,
        ip: req.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
