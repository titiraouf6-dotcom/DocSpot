import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const MIN_WITHDRAWAL = 10000;

const withdrawalSchema = z.object({
  amount: z.number().min(MIN_WITHDRAWAL, `الحد الأدنى للسحب هو ${MIN_WITHDRAWAL} د.ج`),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "DOCTOR") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const doctorId = (session.user as any).doctorId;
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      select: { walletBalance: true },
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const transactions = await prisma.walletTransaction.findMany({
      where: { doctorId },
      orderBy: { createdAt: "desc" },
    });

    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: { doctorId },
      orderBy: { createdAt: "desc" },
    });

    const monthlyIncome = transactions
      .filter(t => t.type === "INCOME" && new Date(t.createdAt) >= startOfMonth)
      .reduce((sum, t) => sum + t.amount, 0);

    // Check if doctor already has a pending withdrawal today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayPendingWithdrawal = await prisma.withdrawalRequest.findFirst({
      where: {
        doctorId,
        status: "PENDING",
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    return NextResponse.json({
      walletBalance: doctor?.walletBalance || 0,
      transactions,
      withdrawals,
      monthlyIncome,
      withdrawalCount: withdrawals.length,
      minWithdrawal: MIN_WITHDRAWAL,
      hasPendingTodayWithdrawal: !!todayPendingWithdrawal,
    });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "DOCTOR") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const doctorId = (session.user as any).doctorId;
    const body = await req.json();

    const parsed = withdrawalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { amount } = parsed.data;

    // Check if doctor already has a pending withdrawal
    const pendingWithdrawal = await prisma.withdrawalRequest.findFirst({
      where: { doctorId, status: "PENDING" },
    });
    if (pendingWithdrawal) {
      return NextResponse.json({ error: "لديك طلب سحب قيد المعالجة بالفعل" }, { status: 400 });
    }

    const doctor = await prisma.doctorProfile.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      return NextResponse.json({ error: "الطبيب غير موجود" }, { status: 404 });
    }

    if (doctor.walletBalance < amount) {
      return NextResponse.json({ error: "رصيد غير كافٍ" }, { status: 400 });
    }

    if (amount < MIN_WITHDRAWAL) {
      return NextResponse.json({ error: `الحد الأدنى للسحب هو ${MIN_WITHDRAWAL} د.ج` }, { status: 400 });
    }

    await prisma.withdrawalRequest.create({
      data: { doctorId, amount },
    });

    return NextResponse.json({ success: true, message: "تم إرسال طلب السحب بنجاح" });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
