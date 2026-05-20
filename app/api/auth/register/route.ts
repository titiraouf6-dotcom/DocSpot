import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const googleMapsRegex = /^https:\/\/(www\.)?(google\.(com|dz|fr|co\.\w+)\/maps|maps\.google\.(com|dz|fr|co\.\w+)|maps\.app\.goo\.gl|goo\.gl\/maps)/;

const baseSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().optional(),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  role: z.enum(["PATIENT", "DOCTOR"]),
});

const doctorSchema = baseSchema.extend({
  role: z.literal("DOCTOR"),
  specialization: z.string().min(1, "التخصص مطلوب"),
  certificateUrl: z.string().url("رابط الشهادة غير صالح"),
  about: z.string().max(2000).optional(),
  wilaya: z.string().min(1, "الولاية مطلوبة"),
  commune: z.string().min(1, "البلدية مطلوبة"),
  googleMapsLink: z.string().regex(googleMapsRegex, "رابط الخرائط يجب أن يكون رابط Google Maps صالح"),
  insuranceAmount: z.number().min(0).optional(),
  ccpNumber: z.string().optional(),
});

const patientSchema = baseSchema.extend({
  role: z.literal("PATIENT"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Determine schema based on role
    const schema = body.role === "DOCTOR" ? doctorSchema : patientSchema;
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, email, phone, password, role } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "البريد الإلكتروني مسجل مسبقاً" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    if (role === "DOCTOR") {
      const data = parsed.data as z.infer<typeof doctorSchema>;

      const user = await prisma.user.create({
        data: {
          name,
          email,
          phone: phone || null,
          passwordHash,
          role: "DOCTOR",
          doctorProfile: {
            create: {
              specialization: data.specialization,
              certificateUrl: data.certificateUrl,
              about: data.about || null,
              wilaya: data.wilaya,
              commune: data.commune,
              googleMapsLink: data.googleMapsLink,
              insuranceAmount: data.insuranceAmount || 1000,
              ccpNumber: data.ccpNumber ? String(data.ccpNumber).trim() : null,
              subscriptionStatus: "PENDING_VERIFICATION",
            },
          },
        },
        include: { doctorProfile: true },
      });

      return NextResponse.json({
        success: true,
        message: "تم إنشاء حسابك بنجاح. حسابك قيد المراجعة من قبل الجهات المعنية. سيتم إعلامك داخل التطبيق عند قبولك.",
        userId: user.id,
        role: "DOCTOR",
      });
    }

    // Patient registration
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: "PATIENT",
        patientProfile: {
          create: {
            walletAvailable: 0,
            walletFrozen: 0,
          },
        },
      },
      include: { patientProfile: true },
    });

    return NextResponse.json({
      success: true,
      message: "تم إنشاء حسابك بنجاح",
      userId: user.id,
      role: "PATIENT",
    });
  } catch {
    return NextResponse.json({ error: "حدث خطأ أثناء التسجيل" }, { status: 500 });
  }
}
