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
    const topups = await prisma.walletTopupRequest.findMany({
      include: {
        patient: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(topups);
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

    const { topupId, action } = await req.json();

    const topup = await prisma.walletTopupRequest.findUnique({
      where: { id: topupId },
      include: { patient: true },
    });
    if (!topup) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

    if (topup.status !== "PENDING") {
      return NextResponse.json({ error: "تم معالجة هذا الطلب مسبقاً" }, { status: 400 });
    }

    if (action === "approve") {
      await prisma.$transaction([
        prisma.walletTopupRequest.update({
          where: { id: topupId },
          data: { status: "APPROVED" },
        }),
        prisma.patientProfile.update({
          where: { id: topup.patientId },
          data: { walletAvailable: { increment: topup.amount } },
        }),
        prisma.walletTransaction.create({
          data: {
            patientId: topup.patientId,
            amount: topup.amount,
            type: "TOPUP",
            description: "شحن رصيد المحفظة",
          },
        }),
      ]);
      await prisma.notification.create({
        data: {
          userId: topup.patient.userId,
          title: "تم شحن محفظتك",
          message: `تم إضافة ${topup.amount} د.ج إلى محفظتك بنجاح.`,
          type: "success",
        },
      });
    } else {
      await prisma.walletTopupRequest.update({
        where: { id: topupId },
        data: { status: "REJECTED" },
      });
      await prisma.notification.create({
        data: {
          userId: topup.patient.userId,
          title: "تم رفض طلب الشحن",
          message: "تم رفض طلب شحن محفظتك. يرجى التأكد من صحة وصل الدفع.",
          type: "error",
        },
      });
    }

    await prisma.adminLog.create({
      data: {
        adminId: (session.user as any).id,
        action: `topup.${action}`,
        details: { topupId, amount: topup.amount },
        ip: req.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
