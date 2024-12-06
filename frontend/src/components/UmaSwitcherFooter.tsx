"use client";

import { useAppState } from "@/hooks/useAppState";
import { Wallet } from "@/hooks/useWalletContext";
import Image from "next/image";
import { SandboxAvatar } from "./SandboxAvatar";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

interface Props {
  wallets: Wallet[];
  isLoading: boolean;
}

export const UmaSwitcherFooter = ({ wallets, isLoading }: Props) => {
  const { currentWallet, setCurrentWallet } = useAppState();

  let walletButtons: JSX.Element[] = [];
  if (isLoading || !currentWallet) {
    walletButtons = Array.from({ length: 3 }, (_, index) => {
      return <Skeleton key={index} className="w-8 h-8 rounded-lg" />;
    });
  } else {
    walletButtons = wallets.map((wallet, index) => {
      return (
        <div
          key={wallet.id}
          className={`
            transition-transform active:scale-95 duration-100
            ${
              wallet.id === currentWallet.id
                ? "ring-1 ring-offset-8 ring-[#C0C9D6] rounded-xl"
                : ""
            }`}
          onClick={() => {
            setCurrentWallet(wallet);
          }}
        >
          <SandboxAvatar
            sandboxWallet={{
              wallet,
              number: index + 1,
            }}
            size="md"
          />
        </div>
      );
    });
  }

  return (
    <div className="flex flex-row p-4 w-full items-center justify-center gap-4">
      {walletButtons}
      <Button className="p-2 bg-[#EBEEF2] hover:bg-gray-300 h-8 w-8 rounded-lg">
        <Image src="/icons/plus.svg" alt="Add UMA" width={24} height={24} />
      </Button>
    </div>
  );
};
