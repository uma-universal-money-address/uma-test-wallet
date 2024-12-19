"use client";

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
import { subscribeToPush } from "@/lib/notificationActions";
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
  } = useWallets();
  const { currentWallet, setCurrentWallet } = useAppState();

  const hasMultipleWallets = wallets && wallets.length > 1;
  const currentWalletIndex =
    wallets?.findIndex((wallet) => wallet.id === currentWallet?.id) || 0;

  const handlePermissions = async () => {
    const requestRes = await Notification.requestPermission();
    if (requestRes === "granted") {
      await subscribeToPush();
    }
  };

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

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between px-4 py-[3px]">
        <div className="flex items-center">
          <span className="text-primary text-[15px] font-semibold leading-5 tracking-[-0.187px]">
            {isLoadingUmas || isLoadingWallets || !currentWallet ? (
              <Skeleton className="w-[200px] h-[15px] rounded-full" />
            ) : (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger disabled={!hasMultipleWallets}>
                    <div className="flex items-center">
                      <SandboxAvatar
                        ownContact={{
                          wallet: currentWallet,
                          number: currentWalletIndex + 1,
                        }}
                        size="md"
                      />
                      <div className="ml-[6px]">
                        {getUmaFromUsername(currentWallet.uma.username)}
                      </div>
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
                              wallet: currentWallet,
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
                <Button
                  variant={"ghost"}
                  disabled={!hasMultipleWallets}
                  style={{ gap: 0 }}
                ></Button>
              </>
            )}
          </span>
        </div>
        <div className="flex items-center">
          <Button variant="icon" size="icon" onClick={handlePermissions}>
            <Image
              src="/icons/bell.svg"
              alt="Notifications"
              width={24}
              height={24}
            />
          </Button>
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
        <div className="pt-2 px-4 pb-3 border-[#EBEEF2] border">
          <UmaSwitcherFooter
            wallets={wallets || []}
            isLoading={isLoadingWallets || !currentWallet}
          />
        </div>
      )}
    </div>
  );
};
