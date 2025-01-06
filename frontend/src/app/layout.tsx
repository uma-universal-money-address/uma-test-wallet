import { Toaster } from "@/components/ui/toaster";
import type { Metadata, Viewport } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { PushNotificationManager } from "./PushNotificationManager";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const roboto_mono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UMA Sandbox",
  description: "Test app for simulating UMA transactions.",
  generator: "Next.js",
  applicationName: "UMA Sandbox",
  appleWebApp: {
    capable: true,
    title: "UMA Sandbox",
    statusBarStyle: "black-translucent",
  },
  icons: [
    {
      rel: "icon",
      url: "/uma-sandbox-app.svg",
    },
    {
      rel: "apple-touch-icon",
      url: "/apple-touch-icon.png",
    },
  ],
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="manifest"
          href="/manifest.json"
          crossOrigin="use-credentials"
        />
      </head>
      <body
        className={`${inter.variable} ${roboto_mono.variable} h-dvh flex items-center justify-center mobile:bg-[#F9F9F9]`}
      >
        <PushNotificationManager />
        <div className="max-w-[432px] mobile:min-w-[400px] w-full h-dvh max-h-[916px] mobile:border-[0.5px] border-[#EBEEF2] mobile:rounded-[32px] mobile:px-4 mobile:pt-6 bg-white">
          {children}
          <Toaster />
        </div>
      </body>
    </html>
  );
}
