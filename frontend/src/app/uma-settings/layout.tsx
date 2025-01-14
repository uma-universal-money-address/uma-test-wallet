"use client";

import WalletContextProvider from "@/hooks/useWalletContext";
import React from "react";
import { Header } from "./Header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <WalletContextProvider>
      <LayoutContent>{children}</LayoutContent>
    </WalletContextProvider>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center h-full">
      <Header />
      {children}
    </div>
  );
}
