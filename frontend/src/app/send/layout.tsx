"use client";

import { CreateUmaDialog } from "@/components/CreateUmaDialog";
import { useAppState } from "@/hooks/useAppState";
import UmaContextProvider from "@/hooks/useUmaContext";
import WalletContextProvider, { useWallets } from "@/hooks/useWalletContext";
import { getUmaFromUsername } from "@/lib/uma";
import React from "react";
import { Header } from "./Header";
import SendPaymentContextProvider from "./SendPaymentContextProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <UmaContextProvider>
      <WalletContextProvider>
        <LayoutContent>{children}</LayoutContent>
      </WalletContextProvider>
    </UmaContextProvider>
  );
}

const LayoutContent = ({ children }: { children: React.ReactNode }) => {
  const {
    isLoading: isLoadingWallets,
    error: walletError,
    fetchWallets,
  } = useWallets();
  const { currentWallet } = useAppState();
  return (
    <div className="flex flex-col items-center h-full">
      {isLoadingWallets || !currentWallet || walletError ? (
        <div className="flex flex-col gap-4 items-center justify-center h-full"></div>
      ) : (
        <>
          <SendPaymentContextProvider
            senderUma={getUmaFromUsername(currentWallet!.uma.username)}
          >
            <Header />
            {children}
          </SendPaymentContextProvider>
          <CreateUmaDialog
            refreshWallets={async () => {
              fetchWallets();
            }}
          />
        </>
      )}
    </div>
  );
};
