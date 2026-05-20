import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.systemSettings.findFirst();
    return NextResponse.json({
      supportEmail: (settings as any)?.supportEmail || "contact@docspot.dz",
      supportPhone: (settings as any)?.ccpPhone || "+213 550 00 00 00",
    });
  } catch (error) {
    return NextResponse.json({ supportEmail: "contact@docspot.dz", supportPhone: "+213 550 00 00 00" });
  }
}
