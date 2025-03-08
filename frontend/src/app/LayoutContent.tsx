"use client";
import { Toaster } from "@/components/ui/toaster";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useLoggedIn } from "@/hooks/useLoggedIn";
import WalletContextProvider from "@/hooks/useWalletContext";
import { Roboto_Mono } from "next/font/google";
import localFont from "next/font/local";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PushNotificationManager } from "./PushNotificationManager";
import { Sidebar } from "./Sidebar";

const inter = localFont({
  src: "./fonts/Inter.var.woff2",
  display: "swap",
  variable: "--font-inter",
  weight: "100 900", // Fixes font weights above 500 on safari: https://github.com/rsms/inter/issues/686
});

const roboto_mono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
});

export const LayoutContent = ({ children }: { children: React.ReactNode }) => {
  const isDesktop = useMediaQuery("(min-width: 800px)");
  const router = useRouter();
  const { isLoggedIn } = useLoggedIn();

  useEffect(() => {
    if (isLoggedIn) {
      router.push("/wallet");
    }
  }, [router, isLoggedIn]);

  return (
    <body
      className={`${inter.variable} ${roboto_mono.variable} h-dvh flex items-center justify-center mobile:bg-[#F9F9F9]`}
    >
      <WalletContextProvider>
        <PushNotificationManager />
        <div className="w-full h-dvh flex flex-row">
          {isDesktop && <Sidebar />}
          <section className="w-full flex grow items-center justify-center">
            <div className="max-w-[432px] min-w-[300px] w-full h-dvh mobile:max-h-[916px] mobile:border-[0.5px] border-[#EBEEF2] mobile:rounded-[32px] mobile:px-4 mobile:pt-6 bg-white">
              {children}
              <Toaster />
            </div>
          </section>
        </div>
      </WalletContextProvider>
    </body>
  );
};
