import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

  // Public paths - redirect logged in users to their dashboard
  const publicPaths = ["/", "/login", "/register"];
  if (publicPaths.includes(pathname)) {
    if (token) {
      const role = (token as any).role;
      const subscriptionStatus = (token as any).subscriptionStatus;

      if (role === "PATIENT") return NextResponse.redirect(new URL("/patient", request.url));
      if (role === "ADMIN") {
        const permissions = (token as any).permissions || [];
        const isMainAdmin = ((token as any).email) === "admin@docspot.dz";
        
        if (isMainAdmin || permissions.includes("view_dashboard")) return NextResponse.redirect(new URL("/admin", request.url));
        if (permissions.includes("manage_doctors")) return NextResponse.redirect(new URL("/admin/doctors", request.url));
        if (permissions.includes("manage_financials")) return NextResponse.redirect(new URL("/admin/topups", request.url));
        if (permissions.includes("manage_users")) return NextResponse.redirect(new URL("/admin/users", request.url));
        if (permissions.includes("manage_admins")) return NextResponse.redirect(new URL("/admin/admins", request.url));
        if (permissions.includes("manage_settings")) return NextResponse.redirect(new URL("/admin/settings", request.url));
        
        return NextResponse.redirect(new URL("/admin/unauthorized", request.url));
      }
      if (role === "DOCTOR") {
        if (subscriptionStatus === "PENDING_VERIFICATION" || subscriptionStatus === "REJECTED") {
          return NextResponse.redirect(new URL("/doctor/pending", request.url));
        }
        if (subscriptionStatus === "VERIFIED" || subscriptionStatus === "SUBSCRIPTION_WAITING_APPROVAL") {
          return NextResponse.redirect(new URL("/doctor/subscription", request.url));
        }
        return NextResponse.redirect(new URL("/doctor", request.url));
      }
    }
    return NextResponse.next();
  }

  // Allow API routes
  if (pathname.startsWith("/api/")) {
    if (pathname.startsWith("/api/auth")) return NextResponse.next();
    if (pathname.startsWith("/api/uploadthing")) return NextResponse.next();
    if (pathname.startsWith("/api/public")) return NextResponse.next();
    if (pathname.startsWith("/api/cron")) return NextResponse.next();
    
    if (!token) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    
    const role = (token as any).role;
    if (pathname.startsWith("/api/admin") && role !== "ADMIN") {
      return NextResponse.json({ error: "وصول مرفوض: خاص بالمسؤولين" }, { status: 403 });
    }
    if (pathname.startsWith("/api/doctor") && role !== "DOCTOR") {
      return NextResponse.json({ error: "وصول مرفوض: خاص بالأطباء" }, { status: 403 });
    }
    if (pathname.startsWith("/api/patient") && role !== "PATIENT") {
      return NextResponse.json({ error: "وصول مرفوض: خاص بالمرضى" }, { status: 403 });
    }
    
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = (token as any).role;
  const subscriptionStatus = (token as any).subscriptionStatus;

  // Admin routes protection
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (role === "ADMIN") {
    const email = (token as any).email;
    const isMainAdmin = email === "admin@docspot.dz";
    const permissions = (token as any).permissions || [];

    if (!isMainAdmin && !pathname.startsWith("/admin/unauthorized")) {
      if (pathname === "/admin" && !permissions.includes("view_dashboard")) {
        if (permissions.includes("manage_doctors")) return NextResponse.redirect(new URL("/admin/doctors", request.url));
        if (permissions.includes("manage_financials")) return NextResponse.redirect(new URL("/admin/topups", request.url));
        if (permissions.includes("manage_users")) return NextResponse.redirect(new URL("/admin/users", request.url));
        if (permissions.includes("manage_admins")) return NextResponse.redirect(new URL("/admin/admins", request.url));
        if (permissions.includes("manage_settings")) return NextResponse.redirect(new URL("/admin/settings", request.url));
        return NextResponse.redirect(new URL("/admin/unauthorized", request.url));
      }
      if (pathname.startsWith("/admin/doctors") && !permissions.includes("manage_doctors")) {
        return NextResponse.redirect(new URL("/admin/unauthorized", request.url));
      }
      if ((pathname.startsWith("/admin/topups") || pathname.startsWith("/admin/withdrawals")) && !permissions.includes("manage_financials")) {
        return NextResponse.redirect(new URL("/admin/unauthorized", request.url));
      }
      if (pathname.startsWith("/admin/users") && !permissions.includes("manage_users")) {
        return NextResponse.redirect(new URL("/admin/unauthorized", request.url));
      }
      if ((pathname.startsWith("/admin/admins") || pathname.startsWith("/admin/logs")) && !permissions.includes("manage_admins")) {
        return NextResponse.redirect(new URL("/admin/unauthorized", request.url));
      }
      if (pathname.startsWith("/admin/settings") && !permissions.includes("manage_settings")) {
        return NextResponse.redirect(new URL("/admin/unauthorized", request.url));
      }
    }
  }

  // Patient routes protection
  if (pathname.startsWith("/patient") && role !== "PATIENT") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Doctor routes protection
  if (pathname.startsWith("/doctor") && role !== "DOCTOR") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Doctor state machine routing
  if (pathname.startsWith("/doctor") && role === "DOCTOR") {
    // PENDING_VERIFICATION or REJECTED -> can only see pending page
    if (subscriptionStatus === "PENDING_VERIFICATION" || subscriptionStatus === "REJECTED") {
      if (!pathname.startsWith("/doctor/pending")) {
        return NextResponse.redirect(new URL("/doctor/pending", request.url));
      }
    }

    // VERIFIED or SUBSCRIPTION_WAITING_APPROVAL -> can only see subscription page
    if (subscriptionStatus === "VERIFIED" || subscriptionStatus === "SUBSCRIPTION_WAITING_APPROVAL") {
      if (!pathname.startsWith("/doctor/subscription")) {
        return NextResponse.redirect(new URL("/doctor/subscription", request.url));
      }
    }

    // ACTIVE -> should NOT access pending page, but CAN access subscription for renewals
    if (subscriptionStatus === "ACTIVE") {
      if (pathname.startsWith("/doctor/pending")) {
        return NextResponse.redirect(new URL("/doctor", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons|images).*)" ],
};
