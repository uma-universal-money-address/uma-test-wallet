"use client";

import { Wallet } from "@/hooks/useWalletContext";
import Image from "next/image";
import { SandboxAvatar } from "./SandboxAvatar";
import { Button } from "./ui/button";

interface Props {
  wallets: Wallet[];
}

export const UmaSwitcherFooter = ({ wallets }: Props) => {
  const walletButtons = wallets.map((wallet, index) => {
    return (
      <div
        key={wallet.id}
        className={`${
          wallet.uma.default
            ? "ring-1 ring-offset-8 ring-[#C0C9D6] rounded-xl"
            : ""
        }`}
        onClick={() => {
          console.log(`Switching to wallet: ${wallet.id}`);
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

  return (
    <div className="flex flex-row p-4 w-full items-center justify-center gap-4">
      {walletButtons}
      <Button className="p-2 bg-[#EBEEF2] hover:bg-gray-300 h-8 w-8 rounded-lg">
        <Image src="/icons/plus.svg" alt="Add UMA" width={24} height={24} />
      </Button>
    </div>
  );
};
