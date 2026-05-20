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
    const doctors = await prisma.doctorProfile.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true, createdAt: true } },
        subscriptionRequests: {
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { user: { createdAt: "desc" } },
    });
    return NextResponse.json(doctors);
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

    const { doctorId, action, adminNote } = await req.json();

    const doctor = await prisma.doctorProfile.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      return NextResponse.json({ error: "الطبيب غير موجود" }, { status: 404 });
    }

    if (action === "verify") {
      // Approve certificate → VERIFIED
      await prisma.doctorProfile.update({
        where: { id: doctorId },
        data: { subscriptionStatus: "VERIFIED", isVerified: true },
      });
      // Create notification
      await prisma.notification.create({
        data: {
          userId: doctor.userId,
          title: "تم قبول حسابك",
          message: "تم قبول وثيقتك بنجاح! يمكنك الآن اختيار خطة اشتراك للبدء.",
          type: "success",
        },
      });
    } else if (action === "reject") {
      await prisma.doctorProfile.update({
        where: { id: doctorId },
        data: { subscriptionStatus: "REJECTED" },
      });
      await prisma.notification.create({
        data: {
          userId: doctor.userId,
          title: "تم رفض حسابك",
          message: adminNote || "تم رفض وثيقتك. يرجى التواصل مع الإدارة.",
          type: "error",
        },
      });
    } else if (action === "approve_subscription") {
      // Approve subscription payment → ACTIVE
      // For renewals: add time from the existing expiry date (not from now)
      // so remaining days are preserved
      const now = new Date();
      const baseDate = (doctor.subscriptionStatus === "ACTIVE" && doctor.subscriptionExpiresAt && doctor.subscriptionExpiresAt > now)
        ? doctor.subscriptionExpiresAt
        : now;

      // Get the plan from the pending request
      const pendingRequest = await prisma.subscriptionRequest.findFirst({
        where: { doctorId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      });
      const effectivePlan = pendingRequest?.plan || doctor.subscriptionPlan;

      const expiresAt = effectivePlan === "YEARLY"
        ? new Date(baseDate.getFullYear() + 1, baseDate.getMonth(), baseDate.getDate())
        : new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, baseDate.getDate());

      await prisma.doctorProfile.update({
        where: { id: doctorId },
        data: {
          subscriptionStatus: "ACTIVE",
          subscriptionPlan: effectivePlan,
          subscriptionExpiresAt: expiresAt,
        },
      });
      // Update subscription request
      await prisma.subscriptionRequest.updateMany({
        where: { doctorId, status: "PENDING" },
        data: { status: "APPROVED" },
      });
      await prisma.notification.create({
        data: {
          userId: doctor.userId,
          title: "تم تفعيل اشتراكك",
          message: "تم قبول وصل الدفع وتفعيل اشتراكك بنجاح! يمكنك الآن البدء باستقبال المرضى.",
          type: "success",
        },
      });
    } else if (action === "reject_subscription") {
      // For renewals (ACTIVE doctors): keep them ACTIVE, just reject the request
      // For first-time (SUBSCRIPTION_WAITING_APPROVAL): revert to VERIFIED
      const isRenewalReject = doctor.subscriptionStatus === "ACTIVE";

      if (!isRenewalReject) {
        await prisma.doctorProfile.update({
          where: { id: doctorId },
          data: { subscriptionStatus: "VERIFIED" },
        });
      }

      await prisma.subscriptionRequest.updateMany({
        where: { doctorId, status: "PENDING" },
        data: { status: "REJECTED", adminNote },
      });
      await prisma.notification.create({
        data: {
          userId: doctor.userId,
          title: isRenewalReject ? "تم رفض طلب التجديد" : "تم رفض وصل الدفع",
          message: adminNote || (isRenewalReject
            ? "تم رفض طلب تجديد اشتراكك. يرجى التواصل مع الإدارة أو إعادة المحاولة."
            : "تم رفض وصل الدفع. يرجى إعادة الرفع."),
          type: "error",
        },
      });
    }

    // Log action
    await prisma.adminLog.create({
      data: {
        adminId: (session.user as any).id,
        action: `doctor.${action}`,
        details: { doctorId, adminNote },
        ip: req.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
