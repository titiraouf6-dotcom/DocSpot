import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const monthStr = searchParams.get("month");
    const yearStr = searchParams.get("year");

    let dateFilter = {};
    let dateFilterAppointments = {};
    
    if (yearStr) {
      const y = parseInt(yearStr);
      let startDate: Date;
      let endDate: Date;
      
      if (monthStr) {
        const m = parseInt(monthStr);
        startDate = new Date(y, m - 1, 1);
        endDate = new Date(y, m, 1);
      } else {
        startDate = new Date(y, 0, 1);
        endDate = new Date(y + 1, 0, 1);
      }
      
      dateFilter = { createdAt: { gte: startDate, lt: endDate } };
      dateFilterAppointments = { dateTime: { gte: startDate, lt: endDate } };
    }

    // Settings for subscription prices
    const settings = await prisma.systemSettings.findFirst();
    const monthlyPrice = settings?.monthlyPrice || 2000;
    const yearlyPrice = settings?.yearlyPrice || 20000;

    const [
      totalUsers,
      totalDoctors,
      activeDoctors,
      totalPatients,
      totalAppointments,
      newUsersPeriod,
      newDoctorsPeriod,
      newPatientsPeriod
    ] = await Promise.all([
      prisma.user.count(),
      prisma.doctorProfile.count(),
      prisma.doctorProfile.count({ where: { subscriptionStatus: "ACTIVE" } }),
      prisma.patientProfile.count(),
      prisma.appointment.count({ where: dateFilterAppointments }),
      prisma.user.count({ where: dateFilter }),
      prisma.doctorProfile.count({ where: { user: dateFilter } }),
      prisma.patientProfile.count({ where: { user: dateFilter } }),
    ]);

    // Appointments per month (last 8 months) - we always show this regardless of the filter, to show trends
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const now = new Date();
    const appointmentsPerMonth = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = await prisma.appointment.count({
        where: { createdAt: { gte: d, lt: end } },
      });
      appointmentsPerMonth.push({ month: months[d.getMonth()], count });
    }

    // Subscription statuses
    const statuses = await prisma.doctorProfile.groupBy({
      by: ["subscriptionStatus"],
      _count: { id: true },
    });

    const statusLabels: Record<string, string> = {
      PENDING_VERIFICATION: "قيد التحقق",
      VERIFIED: "تم التحقق",
      SUBSCRIPTION_WAITING_APPROVAL: "في انتظار الاشتراك",
      ACTIVE: "نشط",
      REJECTED: "مرفوض",
    };

    const subscriptionStatuses = statuses.map((s) => ({
      status: s.subscriptionStatus,
      count: s._count.id,
    }));

    // Financial & Requests stats
    const [pendingTopups, pendingWithdrawals, approvedTopups, approvedWithdrawals, approvedSubs] = await Promise.all([
      prisma.walletTopupRequest.count({ where: { status: "PENDING", ...dateFilter } }),
      prisma.withdrawalRequest.count({ where: { status: "PENDING", ...dateFilter } }),
      prisma.walletTopupRequest.aggregate({ where: { status: "APPROVED", ...dateFilter }, _sum: { amount: true } }),
      prisma.withdrawalRequest.aggregate({ where: { status: "APPROVED", ...dateFilter }, _sum: { amount: true } }),
      prisma.subscriptionRequest.findMany({ where: { status: "APPROVED", ...dateFilter }, select: { plan: true } })
    ]);

    const totalSubscriptionIncome = approvedSubs.reduce((sum, sub) => sum + (sub.plan === "MONTHLY" ? monthlyPrice : yearlyPrice), 0);

    const financialStats = {
      pendingTopups,
      pendingWithdrawals,
      totalTopupAmount: approvedTopups._sum.amount || 0,
      totalWithdrawalAmount: approvedWithdrawals._sum.amount || 0,
      totalSubscriptionIncome,
    };

    return NextResponse.json({
      totalUsers,
      totalDoctors,
      activeDoctors,
      totalPatients,
      totalAppointments,
      newUsersPeriod,
      newDoctorsPeriod,
      newPatientsPeriod,
      monthlyAppointments: appointmentsPerMonth,
      subscriptionStats: subscriptionStatuses,
      financialStats,
    });
  } catch {
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}
