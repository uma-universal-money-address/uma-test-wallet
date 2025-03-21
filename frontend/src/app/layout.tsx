import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LayoutContent } from "./LayoutContent";

export const metadata: Metadata = {
  title: "UMA Test Wallet",
  description: "Test app for simulating UMA transactions.",
  generator: "Next.js",
  applicationName: "UMA Test Wallet",
  appleWebApp: {
    capable: true,
    title: "UMA Test Wallet",
    statusBarStyle: "black-translucent",
  },
  icons: [
    {
      rel: "icon",
      url: "/uma-test-wallet-app.svg",
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
  interactiveWidget: "resizes-content",
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
