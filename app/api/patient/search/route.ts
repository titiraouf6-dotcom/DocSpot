import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wilaya = searchParams.get("wilaya");
    const commune = searchParams.get("commune");
    const specialization = searchParams.get("specialization");
    const search = searchParams.get("search");

    const where: any = {
      subscriptionStatus: "ACTIVE",
      user: { isBlocked: false },
    };

    if (wilaya) where.wilaya = wilaya;
    if (commune) where.commune = commune;
    if (specialization) where.specialization = specialization;
    if (search) {
      where.user = {
        ...where.user,
        name: { equals: search, mode: "insensitive" },
      };
    }

    const doctors = await prisma.doctorProfile.findMany({
      where,
      include: {
        user: { select: { name: true, phone: true } },
        appointments: {
          where: { status: "COMPLETED" },
          include: { review: true },
        },
      },
      orderBy: { user: { name: "asc" } },
    });

    const result = doctors.map((d) => {
      const reviews = d.appointments.filter((a) => a.review).map((a) => a.review!);
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.ratingClinic + r.ratingService) / 2, 0) / reviews.length
        : 0;

      return {
        id: d.id,
        name: d.user.name,
        phone: d.user.phone,
        specialization: d.specialization,
        wilaya: d.wilaya,
        commune: d.commune,
        googleMapsLink: d.googleMapsLink,
        about: d.about,
        bio: d.bio,
        insuranceAmount: d.insuranceAmount,
        profileImageUrl: d.profileImageUrl,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length,
        workingHours: d.workingHoursJson,
      };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
