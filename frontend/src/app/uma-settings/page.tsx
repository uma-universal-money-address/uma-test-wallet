"use client";

import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { SandboxButton } from "@/components/SandboxButton";
import { SettingProps, SettingRow } from "@/components/SettingRow";
import { Wallet } from "@/components/Wallet";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/hooks/useAppState";
import { useWallets } from "@/hooks/useWalletContext";
import { getBackendDomain } from "@/lib/backendDomain";
import { deleteWallet } from "@/lib/deleteWallet";
import isDevelopment from "@/lib/isDevelopment";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
  const { toast } = useToast();
  const router = useRouter();
  const { currentWallet, setCurrentWallet } = useAppState();
  const [isDeleteUmaOpen, setIsDeleteUmaOpen] = useState(false);
  const { wallets, isLoading: isLoadingWallets, fetchWallets } = useWallets();

  const currWalletIndex = wallets
    ? wallets?.findIndex((wallet) => wallet.id === currentWallet?.id) + 1
    : undefined;

  const handleDeleteUma = async () => {
    if (currentWallet) {
      try {
        await deleteWallet(currentWallet.id);
        await fetchWallets();
        setCurrentWallet(
          wallets && wallets.length > 1
            ? wallets.filter((wallet) => wallet.id !== currentWallet.id)[0]
            : undefined,
        );
        router.push("/wallet");
      } catch (e) {
        toast({
          description: `Failed to delete uma: ${e}`,
          variant: "error",
        });
      }
    }
  };

  const settingRows: SettingProps[] = [
    {
      icon: "/icons/square-grid-circle.svg",
      title: "Manage connected apps",
      action: {
        type: "external-link",
        href: `${isDevelopment ? "http" : "https"}://${getBackendDomain()}/nwc`,
      },
      description: "View your UMA Auth connections",
    },
  ];

  return (
    <div className="flex flex-col justify-between h-full w-full overflow-y-scroll no-scrollbar">
      <div className="flex flex-col gap-10">
        <div className="px-4">
          <Wallet
            wallet={currentWallet}
            walletIndex={currWalletIndex}
            isLoading={isLoadingWallets}
            options={{
              showAddBalance: false,
              showUma: true,
              showSend: false,
            }}
          />
        </div>
        <div className="flex flex-col divide-y">
          {settingRows.map((settingProps) => (
            <SettingRow key={settingProps.title} {...settingProps} />
          ))}
        </div>
      </div>
      <div className="p-6">
        <ResponsiveDialog
          title="Are you sure?"
          description="Are you sure you want to log out?"
          open={isDeleteUmaOpen}
          onOpenChange={(open: boolean) => setIsDeleteUmaOpen(open)}
        >
          <div className="flex flex-col px-6 pt-4 pb-4 gap-[10px]">
            <div className="flex flex-col gap-2 pb-6 px-2">
              <span className="text-[26px] font-normal leading-[34px] tracking-[-0.325px]">
                Are you sure?
              </span>
              <span className="text-secondary text-[15px] font-normal leading-[20px] tracking-[-0.187px]">
                This will delete your test UMA along with its test funds and
                connections.
              </span>
            </div>
            <SandboxButton
              buttonProps={{
                variant: "delete",
                onClick: handleDeleteUma,
              }}
              className="w-full"
            >
              Delete test UMA
            </SandboxButton>
            <SandboxButton
              buttonProps={{
                variant: "secondary",
                size: "lg",
                onClick: () => setIsDeleteUmaOpen(false),
              }}
              className="w-full"
            >
              Cancel
            </SandboxButton>
          </div>
        </ResponsiveDialog>
        <SandboxButton
          buttonProps={{
            variant: "delete",
            onClick: () => setIsDeleteUmaOpen(true),
          }}
          className="w-full"
        >
          Delete test UMA
        </SandboxButton>
      </div>
    </div>
  );
}
