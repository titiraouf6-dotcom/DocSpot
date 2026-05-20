import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isBlocked: true,
        createdAt: true,
        doctorProfile: {
          select: { subscriptionStatus: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = users.map(u => ({
      ...u,
      subscriptionStatus: u.doctorProfile?.subscriptionStatus || null,
      doctorProfile: undefined,
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { userId, action } = await req.json();

    if (action === "block") {
      // Prevent admin from blocking themselves
      if (userId === (session.user as any).id) {
        return NextResponse.json({ error: "لا يمكنك حظر حسابك الخاص" }, { status: 400 });
      }
      await prisma.user.update({ where: { id: userId }, data: { isBlocked: true } });
    } else if (action === "unblock") {
      await prisma.user.update({ where: { id: userId }, data: { isBlocked: false } });
    }

    await prisma.adminLog.create({
      data: {
        adminId: (session.user as any).id,
        action: `user.${action}`,
        details: { userId },
        ip: req.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
