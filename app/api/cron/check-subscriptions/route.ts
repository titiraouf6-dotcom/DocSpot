import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Cron job: Check and expire doctor subscriptions
// Should be called daily (e.g., via Vercel Cron or external scheduler)
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret — MANDATORY
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const now = new Date();

    // Find all active doctors with expired subscriptions
    const expiredDoctors = await prisma.doctorProfile.findMany({
      where: {
        subscriptionStatus: "ACTIVE",
        subscriptionExpiresAt: {
          lt: now,
        },
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    if (expiredDoctors.length === 0) {
      return NextResponse.json({
        message: "لا توجد اشتراكات منتهية",
        processed: 0,
      });
    }

    // Process each expired doctor
    const results = [];
    for (const doctor of expiredDoctors) {
      try {
        await prisma.doctorProfile.update({
          where: { id: doctor.id },
          data: {
            subscriptionStatus: "VERIFIED",
            subscriptionPlan: null,
            subscriptionExpiresAt: null,
          },
        });

        await prisma.notification.create({
          data: {
            userId: doctor.user.id,
            title: "انتهى اشتراكك",
            message:
              "لقد انتهت صلاحية اشتراكك. يرجى تجديد الاشتراك للاستمرار في استقبال المرضى.",
            type: "warning",
          },
        });

        results.push({
          doctorId: doctor.id,
          name: doctor.user.name,
          status: "expired",
        });
      } catch {
        results.push({
          doctorId: doctor.id,
          name: doctor.user.name,
          status: "error",
        });
      }
    }

    return NextResponse.json({
      message: `تم معالجة ${results.length} اشتراك منتهي`,
      processed: results.length,
      results,
    });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
