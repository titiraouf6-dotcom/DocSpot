import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

const attendSchema = z.object({
  appointmentId: z.string().min(1),
  attended: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "DOCTOR") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = attendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    const { appointmentId, attended } = parsed.data;
    const doctorId = (session.user as any).doctorId;

    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, doctorId },
      include: { patient: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: "الموعد غير موجود" }, { status: 404 });
    }

    if (appointment.attended !== null) {
      return NextResponse.json({ error: "تم تحديث الحالة مسبقاً" }, { status: 400 });
    }

    if (attended) {
      // Patient attended - unfreeze the insurance amount back to available
      await prisma.$transaction([
        prisma.appointment.update({
          where: { id: appointmentId },
          data: { attended: true, status: "COMPLETED" },
        }),
        prisma.patientProfile.update({
          where: { id: appointment.patientId },
          data: {
            walletFrozen: { decrement: appointment.insuranceAmount },
            walletAvailable: { increment: appointment.insuranceAmount },
          },
        }),
        prisma.walletTransaction.create({
          data: {
            patientId: appointment.patientId,
            amount: appointment.insuranceAmount,
            type: "REFUND",
            description: "استرجاع تأمين حجز (حضور الموعد)",
          },
        }),
      ]);
    } else {
      // Patient did not attend - transfer frozen amount to doctor's wallet
      await prisma.$transaction([
        prisma.appointment.update({
          where: { id: appointmentId },
          data: { attended: false, status: "NO_SHOW" },
        }),
        prisma.patientProfile.update({
          where: { id: appointment.patientId },
          data: {
            walletFrozen: { decrement: appointment.insuranceAmount },
          },
        }),
        prisma.doctorProfile.update({
          where: { id: doctorId },
          data: {
            walletBalance: { increment: appointment.insuranceAmount },
          },
        }),
        prisma.walletTransaction.create({
          data: {
            doctorId,
            amount: appointment.insuranceAmount,
            type: "INCOME",
            description: `غياب مريض عن الموعد (تأمين الحضور)`,
          },
        }),
        prisma.walletTransaction.create({
          data: {
            patientId: appointment.patientId,
            amount: appointment.insuranceAmount,
            type: "PENALTY",
            description: "خصم تأمين حجز (غياب عن الموعد)",
          },
        }),
      ]);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
