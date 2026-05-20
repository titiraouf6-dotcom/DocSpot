import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "DOCTOR") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const doctorId = (session.user as any).doctorId;
    if (!doctorId) {
      return NextResponse.json({ error: "لم يتم العثور على ملف الطبيب" }, { status: 404 });
    }

    const doctor = await prisma.doctorProfile.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      return NextResponse.json({ error: "لم يتم العثور على ملف الطبيب" }, { status: 404 });
    }

    // Allow subscription from VERIFIED (first time) or ACTIVE (renewal)
    const isRenewal = doctor.subscriptionStatus === "ACTIVE";
    if (doctor.subscriptionStatus !== "VERIFIED" && !isRenewal) {
      return NextResponse.json({ error: "لا يمكنك الاشتراك في هذه الحالة" }, { status: 400 });
    }

    // Prevent duplicate pending requests
    const pendingRequest = await prisma.subscriptionRequest.findFirst({
      where: { doctorId, status: "PENDING" },
    });
    if (pendingRequest) {
      return NextResponse.json({ error: "لديك طلب اشتراك قيد المراجعة بالفعل" }, { status: 400 });
    }

    const { plan, paymentProofUrl } = await req.json();

    if (!plan || !paymentProofUrl) {
      return NextResponse.json({ error: "الرجاء اختيار خطة ورفع وصل الدفع" }, { status: 400 });
    }

    if (plan !== "MONTHLY" && plan !== "YEARLY") {
      return NextResponse.json({ error: "خطة غير صالحة" }, { status: 400 });
    }

    // Create subscription request
    await prisma.subscriptionRequest.create({
      data: {
        doctorId,
        plan,
        paymentProofUrl,
        status: "PENDING",
      },
    });

    if (isRenewal) {
      // For renewals: keep ACTIVE status, just store the payment proof
      await prisma.doctorProfile.update({
        where: { id: doctorId },
        data: {
          paymentProofUrl,
        },
      });
    } else {
      // First-time subscription: change status to waiting
      await prisma.doctorProfile.update({
        where: { id: doctorId },
        data: {
          subscriptionStatus: "SUBSCRIPTION_WAITING_APPROVAL",
          subscriptionPlan: plan,
          paymentProofUrl,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: isRenewal
        ? "تم إرسال طلب تجديد الاشتراك بنجاح"
        : "تم إرسال وصل الدفع بنجاح",
    });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
