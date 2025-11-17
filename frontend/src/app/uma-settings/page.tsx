"use client";

import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { SettingProps, SettingRow } from "@/components/SettingRow";
import { TestWalletButton } from "@/components/TestWalletButton";
import { Wallet } from "@/components/Wallet";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/hooks/useAppState";
import {
  useWallets,
  REQUIRED_COUNTERPARTY_FIELD_OPTIONS,
  RequiredCounterpartyField,
} from "@/hooks/useWalletContext";
import { getBackendDomain } from "@/lib/backendDomain";
import { deleteWallet } from "@/lib/deleteWallet";
import isDevelopment from "@/lib/isDevelopment";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormSection } from "./FormSection";
import { CheckboxGroup } from "./CheckboxGroup";
import { updateWallet } from "@/lib/updateWallet";

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

  const handleRequiredCounterpartyFieldsChange = async (
    values: RequiredCounterpartyField[],
  ) => {
    if (!currentWallet) return;

    try {
      const updatedWallet = await updateWallet(currentWallet.id, {
        requiredCounterpartyFields: values,
      });
      setCurrentWallet(updatedWallet);
      await fetchWallets();
    } catch (e) {
      toast({
        description: `Failed to update required counterparty fields: ${e}`,
        variant: "error",
      });
    }
  };

  const settingRows: SettingProps[] = [
    {
      icon: "/icons/square-grid-circle.svg",
      title: "Manage connected apps",
      action: {
        type: "external-link",
        href: `${
          isDevelopment ? "http" : "https"
        }://${getBackendDomain()}/nwc/`,
      },
      description: "View your UMA Auth connections",
    },
  ];

  return (
      <div className="flex flex-col pt-2 px-6 pb-4 gap-6">
        <FormSection title="Required Counterparty Fields">
          <CheckboxGroup
            options={REQUIRED_COUNTERPARTY_FIELD_OPTIONS}
            selectedValues={currentWallet?.requiredCounterpartyFields || []}
            onChange={handleRequiredCounterpartyFieldsChange}
            disabled={!currentWallet}
          />
        </FormSection>

        {settingRows.map((settingProps) => (
          <SettingRow key={settingProps.title} {...settingProps} />
        ))}
        <TestWalletButton
          buttonProps={{
            variant: "delete",
            onClick: () => setIsDeleteUmaOpen(true),
          }}
          className="w-full"
        >
          Delete test UMA
        </TestWalletButton>
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
            <TestWalletButton
              buttonProps={{
                variant: "delete",
                onClick: handleDeleteUma,
              }}
              className="w-full"
            >
              Delete test UMA
            </TestWalletButton>
            <TestWalletButton
              buttonProps={{
                variant: "secondary",
                size: "lg",
                onClick: () => setIsDeleteUmaOpen(false),
              }}
              className="w-full"
            >
              Cancel
            </TestWalletButton>
          </div>
        </ResponsiveDialog>
    </div>
  );
}
