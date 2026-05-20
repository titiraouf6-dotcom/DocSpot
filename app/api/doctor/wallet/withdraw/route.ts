import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const MIN_WITHDRAWAL = 10_000;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "DOCTOR") {
      return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
    }

    const doctorId = (session.user as any).doctorId;
    if (!doctorId) {
      return NextResponse.json({ error: "الملف الشخصي غير موجود" }, { status: 404 });
    }

    const body = await request.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "المبلغ غير صالح" }, { status: 400 });
    }

    if (amount < MIN_WITHDRAWAL) {
      return NextResponse.json(
        { error: `الحد الأدنى للسحب هو ${MIN_WITHDRAWAL.toLocaleString("ar-DZ")} د.ج` },
        { status: 400 }
      );
    }

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      select: { walletBalance: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "الملف الشخصي غير موجود" }, { status: 404 });
    }

    if (amount > doctor.walletBalance) {
      return NextResponse.json({ error: "رصيدك غير كافٍ" }, { status: 400 });
    }

    // Prevent duplicate pending requests
    const pending = await prisma.withdrawalRequest.findFirst({
      where: { doctorId, status: "PENDING" },
    });
    if (pending) {
      return NextResponse.json(
        { error: "لديك طلب سحب قيد الانتظار بالفعل. انتظر معالجته قبل إرسال طلب جديد." },
        { status: 400 }
      );
    }

    const withdrawal = await prisma.withdrawalRequest.create({
      data: { doctorId, amount, status: "PENDING" },
    });

    return NextResponse.json(withdrawal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء طلب السحب" }, { status: 500 });
  }
}
