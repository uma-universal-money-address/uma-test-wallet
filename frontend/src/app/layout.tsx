import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LayoutContent } from "./LayoutContent";

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
      <LayoutContent>{children}</LayoutContent>
    </html>
  );
}
