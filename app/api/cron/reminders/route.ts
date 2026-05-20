import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// This endpoint checks for appointments happening within the next 2 hours
// and creates reminder notifications for patients who haven't been notified yet
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret — MANDATORY
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Find booked appointments within the next 2 hours
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        status: "BOOKED",
        dateTime: { gte: now, lte: twoHoursLater },
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });

    let created = 0;

    for (const apt of upcomingAppointments) {
      const timeStr = new Date(apt.dateTime).toLocaleTimeString("ar-DZ", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Check if we already sent a reminder for this appointment
      const existing = await prisma.notification.findFirst({
        where: {
          userId: apt.patient.userId,
          type: "reminder",
          message: { contains: apt.id },
        },
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            userId: apt.patient.userId,
            title: "تذكير بموعد قادم",
            message: `لديك موعد اليوم مع د. ${apt.doctor.user.name} الساعة ${timeStr}. لا تنسَ الحضور! [${apt.id}]`,
            type: "reminder",
          },
        });
        created++;
      }
    }

    return NextResponse.json({ checked: upcomingAppointments.length, created });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
