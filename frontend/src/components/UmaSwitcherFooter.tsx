"use client";

import { useAppState } from "@/hooks/useAppState";
import { Wallet } from "@/hooks/useWalletContext";
import Image from "next/image";
import { SandboxAvatar } from "./SandboxAvatar";
import { Button } from "./ui/button";

interface Props {
  wallets: Wallet[];
}

export const UmaSwitcherFooter = ({ wallets }: Props) => {
  const { currentWallet, setCurrentWallet, setIsCreateUmaDialogOpen } =
    useAppState();

  const handleChooseWallet = (wallet: Wallet) => {
    setCurrentWallet(wallet);
  };

  let walletButtons: JSX.Element[] = [];
  if (wallets && currentWallet) {
    walletButtons = wallets.map((wallet, index) => {
      return (
        <div
          key={wallet.id}
          className={`
            animate-[fadeInAndSlideUp_0.5s_ease-in-out_forwards]
            transition-transform active:scale-95 duration-100 cursor-pointer
            ${
              wallet.id === currentWallet.id
                ? "ring-1 ring-offset-8 ring-[#C0C9D6] rounded-xl"
                : ""
            }`}
          onClick={() => handleChooseWallet(wallet)}
        >
          <SandboxAvatar
            ownContact={{
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
    <div className="flex flex-row py-4 max-w-full items-center gap-4">
      {walletButtons}
      <Button
        className="p-2 bg-[#EBEEF2] hover:bg-gray-300 h-8 w-8 rounded-lg"
        onClick={() => setIsCreateUmaDialogOpen(true)}
        size="icon"
        variant="icon"
      >
        <Image
          src="/icons/plus.svg"
          alt="Add UMA"
          width={24}
          height={24}
          className="max-w-6"
        />
      </Button>
    </div>
  );
};
