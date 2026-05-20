import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "PATIENT") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const patientId = (session.user as any).patientId;
    const appointments = await prisma.appointment.findMany({
      where: { patientId },
      include: {
        doctor: {
          include: { user: { select: { name: true, image: true } } },
        },
        review: true,
      },
      orderBy: { dateTime: "desc" },
    });
    return NextResponse.json(appointments);
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
