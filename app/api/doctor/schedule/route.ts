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
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      select: { workingHoursJson: true },
    });
    return NextResponse.json({ workingHours: doctor?.workingHoursJson || null });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "DOCTOR") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const doctorId = (session.user as any).doctorId;
    const { workingHours } = await req.json();

    await prisma.doctorProfile.update({
      where: { id: doctorId },
      data: { workingHoursJson: workingHours },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
