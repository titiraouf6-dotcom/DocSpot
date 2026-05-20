"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { useEffect } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-center"
        richColors
        dir="rtl"
        toastOptions={{
          className: "font-sans",
        }}
      />
    </SessionProvider>
  );
}
