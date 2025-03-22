"use client";

import { CreateUmaDialog } from "@/components/CreateUmaDialog";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import { TestWalletAvatar } from "@/components/TestWalletAvatar";
import { Button } from "@/components/ui/button";
import { UmaSwitcherFooter } from "@/components/UmaSwitcherFooter";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/hooks/useAppState";
import { useWallets } from "@/hooks/useWalletContext";
import { getUmaFromUsername } from "@/lib/uma";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UmaSelectorDialog } from "./UmaSelectorDialog";

export default function Layout({ children }: { children: React.ReactNode }) {
  const isDesktop = useMediaQuery("(min-width: 800px)");
  const { toast } = useToast();
  const router = useRouter();
  const {
    wallets,
    isLoading: isLoadingWallets,
    error: walletsError,
    fetchWallets,
  } = useWallets();
  const { currentWallet, setCurrentWallet, setIsUmaSelectorDialogOpen } =
    useAppState();

  const currentWalletIndex =
    wallets?.findIndex((wallet) => wallet.id === currentWallet?.id) || 0;

  const handleCopy = () => {
    if (isLoadingWallets || !currentWallet) {
      return;
    }

    navigator.clipboard.writeText(
      getUmaFromUsername(currentWallet.uma.username),
    );
    toast({
      description: "Copied to clipboard",
    });
  };

  const handleUmaSettings = () => {
    router.push("/uma-settings");
  };

  useEffect(() => {
    if (walletsError) {
      toast({
        description: `Failed to load wallet layout: ${walletsError}`,
        variant: "error",
      });
    }
  }, [walletsError, toast]);

  const handleRefreshWallets = async () => {
    const updatedWallets = await fetchWallets();
    if (updatedWallets) {
      setCurrentWallet(updatedWallets[updatedWallets.length - 1]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PwaInstallBanner dismissable />
      <div className="flex items-center justify-between w-full px-4 py-[3px]">
        {isLoadingWallets || !currentWallet ? (
          <>
            <div
              className="flex items-center overflow-hidden cursor-pointer animate-[fadeIn_0.5s_ease-in-out_forwards]"
              onClick={() => setIsUmaSelectorDialogOpen(true)}
            >
              <span className="min-w-0 pl-[6px]">UMA Test Wallet</span>
              <Image
                src="/icons/chevron-down-small.svg"
                alt="Chevron down"
                width={24}
                height={24}
              />
            </div>
            <div className="flex items-center opacity-20 pointer-events-none">
              <Button variant="icon" size="icon">
                <Image
                  src="/icons/square-behind-square-6.svg"
                  alt="Copy"
                  width={24}
                  height={24}
                />
              </Button>
              <Button variant="icon" size="icon">
                <Image
                  src="/icons/settings-gear-2.svg"
                  alt="Settings"
                  width={24}
                  height={24}
                />
              </Button>
            </div>
          </>
        ) : (
          <>
            <div
              className="flex items-center overflow-hidden cursor-pointer animate-[fadeIn_0.5s_ease-in-out_forwards]"
              onClick={() => setIsUmaSelectorDialogOpen(true)}
            >
              <TestWalletAvatar
                ownContact={{
                  wallet: currentWallet,
                  number: currentWalletIndex + 1,
                }}
                size="sm"
              />
              <span className="min-w-0 pl-[6px] truncate">
                {getUmaFromUsername(currentWallet.uma.username)}
              </span>
              <Image
                src="/icons/chevron-down-small.svg"
                alt="Chevron down"
                width={24}
                height={24}
              />
            </div>
            <div className="flex items-center">
              <Button variant="icon" size="icon" onClick={handleCopy}>
                <Image
                  src="/icons/square-behind-square-6.svg"
                  alt="Copy"
                  width={24}
                  height={24}
                />
              </Button>
              <Button variant="icon" size="icon" onClick={handleUmaSettings}>
                <Image
                  src="/icons/settings-gear-2.svg"
                  alt="Settings"
                  width={24}
                  height={24}
                />
              </Button>
            </div>
          </>
        )}
      </div>
      <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        {children}
      </main>
      {!isLoadingWallets && (
        <>
          <CreateUmaDialog refreshWallets={handleRefreshWallets} />
          <UmaSelectorDialog wallets={wallets || []} />
          {!isDesktop && (
            <div className="pt-2 px-4 pb-3 border-[#EBEEF2] border-t overflow-x-scroll no-scrollbar flex justify-center">
              <UmaSwitcherFooter wallets={wallets || []} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
