import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

const reviewSchema = z.object({
  appointmentId: z.string().min(1, "معرّف الموعد مطلوب"),
  ratingClinic: z.number().int().min(1).max(5),
  ratingService: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "PATIENT") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { appointmentId, ratingClinic, ratingService, comment } = parsed.data;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patientId: (session.user as any).patientId,
        status: "COMPLETED",
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "الموعد غير موجود أو لم يكتمل" }, { status: 404 });
    }

    const existingReview = await prisma.review.findUnique({
      where: { appointmentId },
    });
    if (existingReview) {
      return NextResponse.json({ error: "تم تقييم هذا الموعد مسبقاً" }, { status: 400 });
    }

    await prisma.review.create({
      data: {
        appointmentId,
        ratingClinic,
        ratingService,
        comment: comment || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
