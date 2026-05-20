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
    const withdrawals = await prisma.withdrawalRequest.findMany({
      include: {
        doctor: {
          select: {
            ccpNumber: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(withdrawals);
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

    const { withdrawalId, action } = await req.json();

    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      include: { doctor: true },
    });
    if (!withdrawal) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

    if (withdrawal.status !== "PENDING") {
      return NextResponse.json({ error: "تم معالجة هذا الطلب مسبقاً" }, { status: 400 });
    }

    if (action === "approve") {
      await prisma.$transaction([
        prisma.withdrawalRequest.update({
          where: { id: withdrawalId },
          data: { status: "APPROVED", processedAt: new Date() },
        }),
        prisma.doctorProfile.update({
          where: { id: withdrawal.doctorId },
          data: { walletBalance: { decrement: withdrawal.amount } },
        }),
        prisma.walletTransaction.create({
          data: {
            doctorId: withdrawal.doctorId,
            amount: withdrawal.amount,
            type: "WITHDRAWAL",
            description: "تم سحب المبلغ",
          },
        }),
      ]);
      await prisma.notification.create({
        data: {
          userId: withdrawal.doctor.userId,
          title: "تم قبول طلب السحب",
          message: `تم معالجة طلب سحب ${withdrawal.amount} د.ج بنجاح.`,
          type: "success",
        },
      });
    } else {
      await prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: { status: "REJECTED", processedAt: new Date() },
      });
      await prisma.notification.create({
        data: {
          userId: withdrawal.doctor.userId,
          title: "تم رفض طلب السحب",
          message: "تم رفض طلب السحب. يرجى التواصل مع الإدارة.",
          type: "error",
        },
      });
    }

    await prisma.adminLog.create({
      data: {
        adminId: (session.user as any).id,
        action: `withdrawal.${action}`,
        details: { withdrawalId, amount: withdrawal.amount },
        ip: req.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
