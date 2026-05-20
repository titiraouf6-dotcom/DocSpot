import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    const { patientId, dateTime } = body;

    if (!patientId || !dateTime) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      return NextResponse.json({ error: "الملف الشخصي غير موجود" }, { status: 404 });
    }

    const appointmentDateTime = new Date(dateTime);
    const cancellationDeadline = new Date(
      appointmentDateTime.getTime() - 24 * 60 * 60 * 1000
    );

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        dateTime: appointmentDateTime,
        status: "BOOKED",
        insuranceAmount: doctor.insuranceAmount,
        isManual: true,
        cancellationDeadline,
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء الموعد" }, { status: 500 });
  }
}
