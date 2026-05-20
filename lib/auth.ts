import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            doctorProfile: true,
            patientProfile: true,
            adminPermissions: true,
          },
        });

        if (!user) return null;
        if (user.isBlocked) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
          doctorId: user.doctorProfile?.id || null,
          patientId: user.patientProfile?.id || null,
          subscriptionStatus: user.doctorProfile?.subscriptionStatus || null,
          permissions: user.adminPermissions?.map((p: any) => p.permissionKey) || [],
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.doctorId = (user as any).doctorId;
        token.patientId = (user as any).patientId;
        token.subscriptionStatus = (user as any).subscriptionStatus;
        token.permissions = (user as any).permissions;
        token.lastExpiryCheck = Date.now();
      }

      // Check subscription expiry for active doctors (every 5 minutes)
      if (
        token.role === "DOCTOR" &&
        token.subscriptionStatus === "ACTIVE" &&
        token.doctorId &&
        (!token.lastExpiryCheck || Date.now() - (token.lastExpiryCheck as number) > 5 * 60 * 1000)
      ) {
        try {
          const doctor = await prisma.doctorProfile.findUnique({
            where: { id: token.doctorId as string },
            select: { subscriptionExpiresAt: true, subscriptionStatus: true },
          });

          if (doctor?.subscriptionExpiresAt && new Date() > new Date(doctor.subscriptionExpiresAt)) {
            // Subscription expired → revert to VERIFIED
            await prisma.doctorProfile.update({
              where: { id: token.doctorId as string },
              data: {
                subscriptionStatus: "VERIFIED",
                subscriptionPlan: null,
                subscriptionExpiresAt: null,
              },
            });

            // Send expiry notification
            await prisma.notification.create({
              data: {
                userId: token.id as string,
                title: "انتهى اشتراكك",
                message: "لقد انتهت صلاحية اشتراكك. يرجى تجديد الاشتراك للاستمرار في استقبال المرضى.",
                type: "warning",
              },
            });

            token.subscriptionStatus = "VERIFIED";
          }
          token.lastExpiryCheck = Date.now();
        } catch {
          // Silently fail - subscription check is non-critical
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).doctorId = token.doctorId;
        (session.user as any).patientId = token.patientId;
        (session.user as any).subscriptionStatus = token.subscriptionStatus;
        (session.user as any).permissions = token.permissions || [];
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
};

export default authOptions;
