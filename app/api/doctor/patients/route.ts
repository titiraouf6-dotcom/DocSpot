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
    
    const attendedPatients = await prisma.patientProfile.findMany({
      where: {
        appointments: {
          some: {
            doctorId,
            attended: true
          }
        }
      },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        appointments: {
          where: { doctorId },
          orderBy: { dateTime: "desc" },
          take: 1
        }
      }
    });

    return NextResponse.json(attendedPatients.map((p) => ({
      id: p.id,
      name: p.user.name,
      email: p.user.email,
      phone: p.user.phone,
      lastVisit: p.appointments[0]?.dateTime,
      lastStatus: p.appointments[0]?.status,
    })));
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
