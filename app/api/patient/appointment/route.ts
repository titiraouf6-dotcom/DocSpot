import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

const bookingSchema = z.object({
  doctorId: z.string().min(1, "معرّف الطبيب مطلوب"),
  dateTime: z.string().min(1, "وقت الموعد مطلوب"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "PATIENT") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const patientId = (session.user as any).patientId;
    const body = await req.json();

    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { doctorId, dateTime } = parsed.data;
    const appointmentDate = new Date(dateTime);

    if (isNaN(appointmentDate.getTime())) {
      return NextResponse.json({ error: "تاريخ غير صالح" }, { status: 400 });
    }

    if (appointmentDate <= new Date()) {
      return NextResponse.json({ error: "لا يمكن حجز موعد في الماضي" }, { status: 400 });
    }

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: { user: { select: { name: true } } },
    });
    if (!doctor || doctor.subscriptionStatus !== "ACTIVE") {
      return NextResponse.json({ error: "الطبيب غير متاح" }, { status: 400 });
    }

    const cancellationDeadline = new Date(appointmentDate);
    cancellationDeadline.setHours(cancellationDeadline.getHours() - 24);

    const userId = (session.user as any).id;
    const patientName = session.user?.name || "مريض";
    const dateStr = appointmentDate.toLocaleDateString("ar-DZ", { weekday: "long", day: "numeric", month: "long" });
    const timeStr = appointmentDate.toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" });

    // Interactive transaction to prevent race conditions
    await prisma.$transaction(async (tx) => {
      // Re-check patient balance inside transaction
      const patient = await tx.patientProfile.findUnique({ where: { id: patientId } });
      if (!patient) throw new Error("PATIENT_NOT_FOUND");
      if (patient.walletAvailable < doctor.insuranceAmount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      // Check for conflicting appointments (same doctor, same time slot)
      const existingSlot = await tx.appointment.findFirst({
        where: { doctorId, dateTime: appointmentDate, status: "BOOKED" },
      });
      if (existingSlot) throw new Error("SLOT_TAKEN");

      // Prevent patient from booking same doctor twice in the same day
      const dayStart = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
      const dayEnd = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate() + 1);

      const sameDoctorSameDay = await tx.appointment.findFirst({
        where: { patientId, doctorId, dateTime: { gte: dayStart, lt: dayEnd }, status: "BOOKED" },
      });
      if (sameDoctorSameDay) throw new Error("SAME_DOCTOR_SAME_DAY");

      // Prevent patient from booking different doctors at the exact same time
      const sameTimeConflict = await tx.appointment.findFirst({
        where: { patientId, dateTime: appointmentDate, status: "BOOKED" },
      });
      if (sameTimeConflict) throw new Error("SAME_TIME_CONFLICT");

      // All checks passed — create appointment and freeze balance
      await tx.appointment.create({
        data: {
          patientId,
          doctorId,
          dateTime: appointmentDate,
          insuranceAmount: doctor.insuranceAmount,
          cancellationDeadline,
        },
      });

      await tx.patientProfile.update({
        where: { id: patientId },
        data: {
          walletAvailable: { decrement: doctor.insuranceAmount },
          walletFrozen: { increment: doctor.insuranceAmount },
        },
      });

      await tx.walletTransaction.create({
        data: {
          patientId,
          amount: doctor.insuranceAmount,
          type: "PAYMENT",
          description: `تأمين حجز موعد مع د. ${doctor.user.name}`,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          title: "تم حجز موعدك بنجاح",
          message: `تم حجز موعدك مع د. ${doctor.user.name} يوم ${dateStr} الساعة ${timeStr}.`,
          type: "success",
        },
      });

      await tx.notification.create({
        data: {
          userId: doctor.userId,
          title: "حجز موعد جديد",
          message: `قام ${patientName} بحجز موعد يوم ${dateStr} الساعة ${timeStr}.`,
          type: "info",
        },
      });
    });

    return NextResponse.json({ success: true, message: "تم حجز الموعد بنجاح" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === "PATIENT_NOT_FOUND") return NextResponse.json({ error: "الملف الشخصي غير موجود" }, { status: 404 });
    if (message === "INSUFFICIENT_BALANCE") return NextResponse.json({ error: `رصيدك غير كافٍ لتغطية تأمين الحضور` }, { status: 400 });
    if (message === "SLOT_TAKEN") return NextResponse.json({ error: "هذا الموعد محجوز مسبقاً" }, { status: 400 });
    if (message === "SAME_DOCTOR_SAME_DAY") return NextResponse.json({ error: "لديك موعد محجوز بالفعل عند هذا الطبيب في نفس اليوم" }, { status: 400 });
    if (message === "SAME_TIME_CONFLICT") return NextResponse.json({ error: "لديك موعد محجوز بالفعل في نفس الساعة عند طبيب آخر" }, { status: 400 });
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "PATIENT") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const patientId = (session.user as any).patientId;
    const { searchParams } = new URL(req.url);
    const appointmentId = searchParams.get("id");
    const forceCancel = searchParams.get("force") === "true";

    if (!appointmentId) {
      return NextResponse.json({ error: "معرف الموعد مطلوب" }, { status: 400 });
    }

    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, patientId, status: "BOOKED" },
      include: { doctor: true },
    });
    if (!appointment) {
      return NextResponse.json({ error: "الموعد غير موجود" }, { status: 404 });
    }

    // Check if appointment time has already passed
    if (new Date() >= new Date(appointment.dateTime)) {
      return NextResponse.json({ error: "لا يمكن إلغاء موعد قد مر وقته" }, { status: 400 });
    }

    const isBeforeDeadline = new Date(appointment.cancellationDeadline) > new Date();

    if (isBeforeDeadline) {
      // EARLY cancellation: refund the frozen amount to patient
      await prisma.$transaction([
        prisma.appointment.update({
          where: { id: appointmentId },
          data: { status: "CANCELLED" },
        }),
        prisma.patientProfile.update({
          where: { id: patientId },
          data: {
            walletAvailable: { increment: appointment.insuranceAmount },
            walletFrozen: { decrement: appointment.insuranceAmount },
          },
        }),
        prisma.walletTransaction.create({
          data: {
            patientId,
            amount: appointment.insuranceAmount,
            type: "REFUND",
            description: "استرجاع تأمين حجز (إلغاء مبكر)",
          },
        }),
      ]);
      return NextResponse.json({ success: true, refunded: true });
    } else {
      // LATE cancellation: require force flag
      if (!forceCancel) {
        return NextResponse.json({
          error: "late_cancellation",
          message: "الإلغاء بعد مهلة 24 ساعة سيؤدي لخسارة مبلغ التأمين",
          amount: appointment.insuranceAmount,
        }, { status: 400 });
      }

      // Forfeit insurance: frozen amount goes to doctor's wallet
      await prisma.$transaction([
        prisma.appointment.update({
          where: { id: appointmentId },
          data: { status: "CANCELLED" },
        }),
        prisma.patientProfile.update({
          where: { id: patientId },
          data: {
            walletFrozen: { decrement: appointment.insuranceAmount },
          },
        }),
        prisma.doctorProfile.update({
          where: { id: appointment.doctorId },
          data: {
            walletBalance: { increment: appointment.insuranceAmount },
          },
        }),
        prisma.walletTransaction.create({
          data: {
            doctorId: appointment.doctorId,
            amount: appointment.insuranceAmount,
            type: "INCOME",
            description: `إلغاء متأخر لموعد (تأمين الحضور)`,
          },
        }),
        prisma.walletTransaction.create({
          data: {
            patientId,
            amount: appointment.insuranceAmount,
            type: "PENALTY",
            description: "خصم تأمين حجز (إلغاء متأخر)",
          },
        }),
      ]);
      return NextResponse.json({ success: true, refunded: false });
    }
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
