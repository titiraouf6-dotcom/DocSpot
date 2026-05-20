import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, approved } = body;

    if (!requestId || typeof approved !== "boolean") {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    const topupRequest = await prisma.walletTopupRequest.findUnique({
      where: { id: requestId },
    });

    if (!topupRequest) {
      return NextResponse.json({ error: "طلب الشحن غير موجود" }, { status: 404 });
    }

    if (topupRequest.status !== "PENDING") {
      return NextResponse.json({ error: "تم معالجة هذا الطلب مسبقاً" }, { status: 400 });
    }

    if (approved) {
      await prisma.$transaction([
        prisma.walletTopupRequest.update({
          where: { id: requestId },
          data: { status: "APPROVED" },
        }),
        prisma.patientProfile.update({
          where: { id: topupRequest.patientId },
          data: { walletAvailable: { increment: topupRequest.amount } },
        }),
      ]);
    } else {
      await prisma.walletTopupRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" },
      });
    }

    return NextResponse.json({ message: approved ? "تم قبول الطلب بنجاح" : "تم رفض الطلب" });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء معالجة الطلب" }, { status: 500 });
  }
}
