import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { hash } from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        name: true,
        email: true,
        isBlocked: true,
        createdAt: true,
        adminPermissions: {
          select: { permissionKey: true }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json(admins);
  } catch (error) {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { adminPermissions: true }
    });

    const isMainAdmin = currentUser?.email === "admin@docspot.dz";
    const hasManageAdmins = currentUser?.adminPermissions.some(p => p.permissionKey === "manage_admins");

    if (!isMainAdmin && !hasManageAdmins) {
      return NextResponse.json({ error: "لا تملك صلاحية إدارة المشرفين" }, { status: 403 });
    }

    const { name, email, password, permissions } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "الرجاء ملء جميع الحقول" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل" }, { status: 400 });
    }

    const passwordHash = await hash(password, 12);

    const newAdmin = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "ADMIN",
        adminPermissions: {
          create: (permissions || []).map((p: string) => ({ permissionKey: p }))
        }
      }
    });

    return NextResponse.json({ success: true, admin: { id: newAdmin.id, name: newAdmin.name, email: newAdmin.email } });
  } catch {
    return NextResponse.json({ error: "فشل في إضافة المشرف" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { adminPermissions: true }
    });

    const isMainAdmin = currentUser?.email === "admin@docspot.dz";
    const hasManageAdmins = currentUser?.adminPermissions.some(p => p.permissionKey === "manage_admins");

    if (!isMainAdmin && !hasManageAdmins) {
      return NextResponse.json({ error: "لا تملك صلاحية إدارة المشرفين" }, { status: 403 });
    }

    const { adminId, isBlocked, permissions } = await req.json();

    // Prevent blocking or removing permissions from the self if needed, or main admin
    const adminToUpdate = await prisma.user.findUnique({ where: { id: adminId } });
    if (!adminToUpdate || adminToUpdate.role !== "ADMIN") {
      return NextResponse.json({ error: "المشرف غير موجود" }, { status: 404 });
    }

    if (adminToUpdate.email === "admin@docspot.dz") {
      return NextResponse.json({ error: "لا يمكن تعديل المشرف الرئيسي" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      // Update block status
      if (isBlocked !== undefined) {
        await tx.user.update({
          where: { id: adminId },
          data: { isBlocked }
        });
      }

      // Update permissions if provided
      if (permissions && Array.isArray(permissions)) {
        await tx.adminPermission.deleteMany({
          where: { adminId }
        });
        
        if (permissions.length > 0) {
          await tx.adminPermission.createMany({
            data: permissions.map(p => ({ adminId, permissionKey: p }))
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل في تحديث المشرف" }, { status: 500 });
  }
}
