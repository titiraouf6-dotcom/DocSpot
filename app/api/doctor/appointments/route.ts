import { NextRequest, NextResponse } from "next/server";
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
    const appointments = await prisma.appointment.findMany({
      where: { doctorId },
      include: {
        patient: { include: { user: { select: { name: true, phone: true, email: true } } } },
      },
      orderBy: { dateTime: "desc" },
    });
    return NextResponse.json(appointments);
  } catch (error) {
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
    const { patientEmail, dateTime } = await req.json();

    // Find patient by email
    const user = await prisma.user.findUnique({
      where: { email: patientEmail },
      include: { patientProfile: true },
    });

    if (!user || !user.patientProfile) {
      return NextResponse.json({ error: "لم يتم العثور على مريض بهذا البريد" }, { status: 404 });
    }

    const doctor = await prisma.doctorProfile.findUnique({ where: { id: doctorId } });
    if (!doctor) return NextResponse.json({ error: "طبيب غير موجود" }, { status: 404 });

    // Check patient has enough balance
    if (user.patientProfile.walletAvailable < doctor.insuranceAmount) {
      return NextResponse.json({ error: "رصيد المريض غير كافٍ لتغطية تأمين الحضور" }, { status: 400 });
    }

    const appointmentDate = new Date(dateTime);

    // Prevent booking in the past
    if (appointmentDate <= new Date()) {
      return NextResponse.json({ error: "لا يمكن حجز موعد في الماضي" }, { status: 400 });
    }

    // Check for conflicting appointments
    const existing = await prisma.appointment.findFirst({
      where: {
        doctorId,
        dateTime: appointmentDate,
        status: "BOOKED",
      },
    });
    if (existing) {
      return NextResponse.json({ error: "هذا الموعد محجوز مسبقاً" }, { status: 400 });
    }

    const cancellationDeadline = new Date(appointmentDate);
    cancellationDeadline.setHours(cancellationDeadline.getHours() - 24);

    const doctorName = session.user?.name || "الطبيب";
    const dateStr = appointmentDate.toLocaleDateString("ar-DZ", { weekday: "long", day: "numeric", month: "long" });
    const timeStr = appointmentDate.toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" });

    // Create appointment, freeze amount, log transaction, and notify
    await prisma.$transaction([
      prisma.appointment.create({
        data: {
          patientId: user.patientProfile.id,
          doctorId,
          dateTime: appointmentDate,
          insuranceAmount: doctor.insuranceAmount,
          isManual: true,
          cancellationDeadline,
        },
      }),
      prisma.patientProfile.update({
        where: { id: user.patientProfile.id },
        data: {
          walletAvailable: { decrement: doctor.insuranceAmount },
          walletFrozen: { increment: doctor.insuranceAmount },
        },
      }),
      prisma.walletTransaction.create({
        data: {
          patientId: user.patientProfile.id,
          amount: doctor.insuranceAmount,
          type: "PAYMENT",
          description: `تأمين حجز يدوي مع د. ${doctorName}`,
        },
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          title: "تم حجز موعد لك",
          message: `قام د. ${doctorName} بحجز موعد لك يوم ${dateStr} الساعة ${timeStr}.`,
          type: "info",
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
