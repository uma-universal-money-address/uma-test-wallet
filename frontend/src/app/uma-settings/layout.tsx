"use client";

import React from "react";
import { Header } from "./Header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <LayoutContent>{children}</LayoutContent>;
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center h-full">
      <Header />
      {children}
    </div>
  );
}
