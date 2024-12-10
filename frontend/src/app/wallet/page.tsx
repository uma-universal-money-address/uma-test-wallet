"use client";

import { Wallet } from "@/components/Wallet";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/hooks/useAppState";
import { useWallets } from "@/hooks/useWalletContext";
import { getUmaFromUsername } from "@/lib/uma";
import { useEffect } from "react";
import { TransactionTable } from "./TransactionTable";

export default function Page() {
  const { toast } = useToast();
  const { isLoading: isLoadingWallets, error } = useWallets();
  const currentWallet = useAppState((state) => state.currentWallet);

  useEffect(() => {
    if (error) {
      toast({
        title: `Failed to fetch user uma: ${error}`,
        variant: "error",
      });
    }
  }, [error, toast]);

  return (
    <div className="flex flex-col pt-2 px-6 pb-4 gap-6">
      <Wallet
        uma={
          currentWallet
            ? getUmaFromUsername(currentWallet?.uma.username)
            : undefined
        }
        wallet={currentWallet}
        isLoading={isLoadingWallets}
      />
      <TransactionTable />
    </div>
  );
}
