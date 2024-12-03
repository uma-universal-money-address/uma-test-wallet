"use client";

import UmaContextProvider from "@/hooks/useUmaContext";
import React from "react";
import { Header } from "./Header";
import SendPaymentContextProvider from "./SendPaymentContextProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <UmaContextProvider>
      <LayoutContent>{children}</LayoutContent>
    </UmaContextProvider>
  );
}

const LayoutContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col items-center h-full">
      <SendPaymentContextProvider>
        <Header />
        {children}
      </SendPaymentContextProvider>
    </div>
  );
};
