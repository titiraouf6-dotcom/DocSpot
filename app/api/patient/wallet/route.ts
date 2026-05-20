import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "PATIENT") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const patientId = (session.user as any).patientId;
    const patient = await prisma.patientProfile.findUnique({
      where: { id: patientId },
      select: { walletAvailable: true, walletFrozen: true },
    });
    const topups = await prisma.walletTopupRequest.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });
    const transactions = await prisma.walletTransaction.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      walletAvailable: patient?.walletAvailable || 0,
      walletFrozen: patient?.walletFrozen || 0,
      topups,
      transactions,
    });
  } catch (error) {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "PATIENT") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const patientId = (session.user as any).patientId;
    const { amount, paymentProofUrl } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "المبلغ غير صالح" }, { status: 400 });
    }
    if (!paymentProofUrl) {
      return NextResponse.json({ error: "الرجاء رفع وصل الدفع" }, { status: 400 });
    }

    await prisma.walletTopupRequest.create({
      data: {
        patientId,
        amount,
        paymentProofUrl,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, message: "تم إرسال طلب الشحن بنجاح" });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
