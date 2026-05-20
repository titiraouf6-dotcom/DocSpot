import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "DOCTOR") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { doctorProfile: true },
    });
    const doctorId = user?.doctorProfile?.id;

    // Check for pending renewal request
    let hasPendingRenewal = false;
    if (doctorId) {
      const pendingRequest = await prisma.subscriptionRequest.findFirst({
        where: { doctorId, status: "PENDING" },
      });
      hasPendingRenewal = !!pendingRequest;
    }

    return NextResponse.json({
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
      specialization: user?.doctorProfile?.specialization,
      about: user?.doctorProfile?.about,
      bio: user?.doctorProfile?.bio,
      wilaya: user?.doctorProfile?.wilaya,
      commune: user?.doctorProfile?.commune,
      googleMapsLink: user?.doctorProfile?.googleMapsLink,
      insuranceAmount: user?.doctorProfile?.insuranceAmount,
      profileImageUrl: user?.doctorProfile?.profileImageUrl,
      ccpNumber: user?.doctorProfile?.ccpNumber ?? null,
      subscriptionStatus: user?.doctorProfile?.subscriptionStatus,
      subscriptionPlan: user?.doctorProfile?.subscriptionPlan,
      subscriptionExpiresAt: user?.doctorProfile?.subscriptionExpiresAt,
      hasPendingRenewal,
    });
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
    const userId = (session.user as any).id;
    const doctorId = (session.user as any).doctorId;
    const body = await req.json();

    // User-level updates (only phone and password are editable)
    const updateUser: any = {};
    if (body.phone !== undefined) updateUser.phone = body.phone;
    if (body.password && body.password.length >= 6) {
      updateUser.passwordHash = await bcrypt.hash(body.password, 12);
    }

    // Doctor profile updates
    const updateDoctor: any = {};
    if (body.about !== undefined) updateDoctor.about = body.about;
    if (body.bio !== undefined) updateDoctor.bio = body.bio;
    if (body.wilaya !== undefined) updateDoctor.wilaya = body.wilaya;
    if (body.commune !== undefined) updateDoctor.commune = body.commune;
    if (body.googleMapsLink !== undefined) updateDoctor.googleMapsLink = body.googleMapsLink;
    if (body.insuranceAmount !== undefined) updateDoctor.insuranceAmount = body.insuranceAmount;
    if (body.profileImageUrl !== undefined) updateDoctor.profileImageUrl = body.profileImageUrl;

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: updateUser }),
      prisma.doctorProfile.update({ where: { id: doctorId }, data: updateDoctor }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
