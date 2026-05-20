import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "DOCTOR") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const doctorId = (session.user as any).doctorId;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayAppointments, monthCount, totalPatients, doctor] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          doctorId,
          dateTime: { gte: startOfDay, lt: endOfDay },
          status: "BOOKED",
        },
        include: {
          patient: {
            include: { user: { select: { name: true, phone: true } } },
          },
        },
        orderBy: { dateTime: "asc" },
      }),
      prisma.appointment.count({
        where: {
          doctorId,
          dateTime: { gte: startOfMonth },
        },
      }),
      prisma.appointment.groupBy({
        by: ["patientId"],
        where: { doctorId },
      }),
      prisma.doctorProfile.findUnique({
        where: { id: doctorId },
        select: { walletBalance: true },
      }),
    ]);

    return NextResponse.json({
      todayCount: todayAppointments.length,
      monthCount,
      totalPatients: totalPatients.length,
      walletBalance: doctor?.walletBalance || 0,
      todayAppointments,
    });
  } catch {
    return NextResponse.json({ error: "فشل في تحميل البيانات" }, { status: 500 });
  }
}
