"use client";

import React from "react";
import { Header } from "./Header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <LayoutContent>{children}</LayoutContent>;
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (

    <div className="flex flex-col h-full">
      <Header />
      <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        {children}
      </main>
    </div>
  );
}
