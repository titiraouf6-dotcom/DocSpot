import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date"); // YYYY-MM-DD

    if (!doctorId || !date) {
      return NextResponse.json({ error: "معطيات ناقصة" }, { status: 400 });
    }

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
    });

    if (!doctor || !doctor.workingHoursJson) {
      return NextResponse.json({ slots: [], message: "لا يوجد جدول عمل" });
    }

    const workingHours = doctor.workingHoursJson as Record<string, any>;

    // Get the day name for the selected date
    const selectedDate = new Date(date + "T00:00:00");
    const dayIndex = selectedDate.getDay();
    const dayMap = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = dayMap[dayIndex];
    const daySchedule = workingHours[dayName];

    if (!daySchedule || !daySchedule.enabled) {
      return NextResponse.json({ slots: [], message: "الطبيب لا يعمل في هذا اليوم" });
    }

    // Generate 30-minute time slots
    const [startH, startM] = daySchedule.start.split(":").map(Number);
    const [endH, endM] = daySchedule.end.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const breaks: { start: number; end: number }[] = (daySchedule.breaks || []).map((b: any) => {
      const [bsH, bsM] = b.start.split(":").map(Number);
      const [beH, beM] = b.end.split(":").map(Number);
      return { start: bsH * 60 + bsM, end: beH * 60 + beM };
    });

    // Get existing booked appointments for this doctor on this date
    const dateStart = new Date(date + "T00:00:00");
    const dateEnd = new Date(date + "T23:59:59");
    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        dateTime: { gte: dateStart, lte: dateEnd },
        status: "BOOKED",
      },
      select: { dateTime: true },
    });

    const bookedTimes = new Set(
      bookedAppointments.map((a) => {
        const d = new Date(a.dateTime);
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      })
    );

    // Check if the selected date is today
    const now = new Date();
    const isToday =
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const slots: { time: string; available: boolean; reason?: string }[] = [];

    for (let m = startMinutes; m < endMinutes; m += 30) {
      const hours = Math.floor(m / 60);
      const mins = m % 60;
      const timeStr = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;

      // Check if in break period
      const isBreak = breaks.some((b) => m >= b.start && m < b.end);
      // Check if already booked
      const isBooked = bookedTimes.has(timeStr);
      // Check if in the past (for today)
      const isPast = isToday && m <= currentMinutes;

      let available = true;
      let reason: string | undefined;

      if (isPast) {
        available = false;
        reason = "past";
      } else if (isBreak) {
        available = false;
        reason = "break";
      } else if (isBooked) {
        available = false;
        reason = "booked";
      }

      slots.push({ time: timeStr, available, reason });
    }

    return NextResponse.json({ slots, dayName });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
