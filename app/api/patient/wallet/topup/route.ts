import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "PATIENT") {
      return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
    }

    const patientId = (session.user as any).patientId;
    if (!patientId) {
      return NextResponse.json({ error: "الملف الشخصي غير موجود" }, { status: 404 });
    }

    const body = await request.json();
    const { amount, paymentProofUrl } = body;

    if (!amount || !paymentProofUrl) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "المبلغ يجب أن يكون أكبر من صفر" }, { status: 400 });
    }

    const topupRequest = await prisma.walletTopupRequest.create({
      data: {
        patientId,
        amount,
        paymentProofUrl,
        status: "PENDING",
      },
    });

    return NextResponse.json(topupRequest, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء معالجة الطلب" }, { status: 500 });
  }
}
