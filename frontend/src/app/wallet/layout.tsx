"use client";

import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import { SandboxAvatar } from "@/components/SandboxAvatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { UmaSwitcherFooter } from "@/components/UmaSwitcherFooter";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/hooks/useAppState";
import UmaContextProvider, { useUma } from "@/hooks/useUmaContext";
import WalletContextProvider, { useWallets } from "@/hooks/useWalletContext";
import { getUmaFromUsername } from "@/lib/uma";
import Image from "next/image";
import { useEffect } from "react";

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
  const { toast } = useToast();
  const { isLoading: isLoadingUmas, error: umasError } = useUma();
  const {
    wallets,
    isLoading: isLoadingWallets,
    error: walletsError,
    fetchWallets,
  } = useWallets();
  const { currentWallet, setCurrentWallet } = useAppState();

  const hasMultipleWallets = wallets && wallets.length > 1;
  const currentWalletIndex =
    wallets?.findIndex((wallet) => wallet.id === currentWallet?.id) || 0;

  const handleCopy = () => {
    if (isLoadingUmas || isLoadingWallets) {
      return;
    }

    navigator.clipboard.writeText(
      getUmaFromUsername(currentWallet!.uma.username),
    );
    toast({
      title: "Copied to clipboard",
    });
  };

  useEffect(() => {
    const anyError = umasError || walletsError;
    if (anyError) {
      toast({
        title: `Failed to load wallet layout: ${anyError}`,
        variant: "error",
      });
    }
  }, [umasError, walletsError, toast]);

  const handleRefreshWallets = async () => {
    const updatedWallets = await fetchWallets();
    if (updatedWallets) {
      setCurrentWallet(updatedWallets[updatedWallets.length - 1]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PwaInstallBanner />
      <div className="flex items-center justify-between w-full px-4 py-[3px]">
        <div className="flex items-center w-[70%] text-primary text-[15px] font-semibold leading-5 tracking-[-0.187px]">
          {isLoadingUmas || isLoadingWallets || !currentWallet ? (
            <Skeleton className="w-[200px] h-[15px] rounded-full" />
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={!hasMultipleWallets}
                  className="w-full"
                >
                  <div className="flex items-center">
                    <SandboxAvatar
                      ownContact={{
                        wallet: currentWallet,
                        number: currentWalletIndex + 1,
                      }}
                      size="md"
                    />
                    <span className="min-w-0 pl-[6px] truncate">
                      {getUmaFromUsername(currentWallet.uma.username)}
                    </span>
                    {hasMultipleWallets && (
                      <Image
                        src="/icons/chevron-down-small.svg"
                        alt="Chevron down"
                        width={24}
                        height={24}
                      />
                    )}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {wallets?.map((wallet, index) =>
                    wallet.id === currentWallet.id ? null : (
                      <DropdownMenuItem
                        key={wallet.id}
                        onClick={() => setCurrentWallet(wallet)}
                      >
                        <SandboxAvatar
                          ownContact={{
                            wallet,
                            number: index + 1,
                          }}
                          size="md"
                        />
                        {getUmaFromUsername(wallet.uma.username)}
                      </DropdownMenuItem>
                    ),
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
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
          <Button variant="icon" size="icon">
            <Image
              src="/icons/settings-gear-2.svg"
              alt="Settings"
              width={24}
              height={24}
            />
          </Button>
        </div>
      </div>
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
      {wallets && wallets.length > 0 && (
        <div className="pt-2 px-4 pb-3 border-[#EBEEF2] border-t overflow-x-scroll no-scrollbar flex justify-center">
          <UmaSwitcherFooter
            wallets={wallets || []}
            refreshWallets={handleRefreshWallets}
          />
        </div>
      )}
    </div>
  );
};
