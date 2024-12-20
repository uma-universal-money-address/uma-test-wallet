"use client";

import OnboardingStepContextProvider, {
  OnboardingStep,
  useOnboardingStepContext,
} from "@/app/(onboarding)/OnboardingStepContextProvider";
import { Steps } from "@/app/(onboarding)/Steps";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/hooks/useAppState";
import { Wallet } from "@/hooks/useWalletContext";
import { convertToNormalDenomination } from "@/lib/convertToNormalDenomination";
import { getUmaFromUsername } from "@/lib/uma";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SandboxAvatar } from "./SandboxAvatar";
import { SandboxButton } from "./SandboxButton";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";

const MAX_WALLETS = 10;

const WalletRows = ({
  currentWallet,
  wallets,
  handleChooseWallet,
}: {
  currentWallet: Wallet;
  wallets: Wallet[];
  handleChooseWallet: (wallet: Wallet) => void;
}) => {
  const { toast } = useToast();
  const handleCopy = (umaAddress: string) => {
    navigator.clipboard.writeText(umaAddress);

    toast({
      title: "Copied to clipboard",
    });
  };

  return (
    <div className="flex flex-col divide-y">
      {wallets.map((wallet, index) => {
        const umaAddress = getUmaFromUsername(wallet.uma.username);
        const isCurrentWallet = wallet.id === currentWallet.id;
        const amount = convertToNormalDenomination(
          wallet.amountInLowestDenom,
          wallet.currency,
        );
        const amountLocaleString = `${Number(amount).toLocaleString("en", {
          maximumFractionDigits: wallet.currency.decimals,
        })} ${wallet.currency.code}`;
        return (
          <div
            key={wallet.id}
            className="flex flex-row justify-between py-5 px-6"
            onClick={() => handleChooseWallet(wallet)}
          >
            <DrawerClose className="flex flex-row items-center">
              <div className="pr-4">
                <SandboxAvatar
                  ownContact={{
                    wallet,
                    number: index + 1,
                  }}
                  size="md"
                />
              </div>
              <div className="flex flex-col gap-[2px] items-start">
                <span className="text-primary font-normal text-[15px] leading-[20px] tracking-[-0.187px]">
                  {umaAddress}
                </span>
                <span className="text-secondary font-normal text-[13px] leading-[18px] tracking-[-0.162px]">
                  {amountLocaleString}
                </span>
              </div>
            </DrawerClose>
            <Button
              variant="icon"
              size="icon"
              onClick={() => handleCopy(umaAddress)}
            >
              <Image
                src={
                  isCurrentWallet
                    ? "/icons/checkmark-2-small.svg"
                    : "/icons/square-behind-square-6.svg"
                }
                alt={isCurrentWallet ? "Checkmark" : "Copy"}
                width={24}
                height={24}
                className={isCurrentWallet ? "" : "opacity-50"}
              />
            </Button>
          </div>
        );
      })}
    </div>
  );
};

interface Props {
  wallets: Wallet[];
  refreshWallets: () => Promise<void>;
}

export const UmaSwitcherFooter = ({ wallets, refreshWallets }: Props) => {
  const { toast } = useToast();
  const { currentWallet, setCurrentWallet } = useAppState();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreatingUma, setIsCreatingUma] = useState(false);

  const handleCreateUma = () => {
    const hasMaxWallets = wallets.length >= MAX_WALLETS;
    if (hasMaxWallets) {
      toast({
        title:
          "You have reached the maximum number of test UMAs for this account",
      });
    } else {
      setIsCreatingUma(true);
    }
  };

  const handleChooseWallet = (wallet: Wallet) => {
    setCurrentWallet(wallet);
    setIsDrawerOpen(false);
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
    <div className="flex flex-row p-4 w-full items-center justify-start overflow-x-scroll no-scrollbar gap-4">
      {walletButtons}
      {currentWallet && wallets && (
        <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
          <Button
            className="p-2 bg-[#EBEEF2] hover:bg-gray-300 h-8 w-8 rounded-lg"
            onClick={() => setIsDrawerOpen(true)}
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
          <DrawerContent className="w-full">
            {isCreatingUma ? (
              <OnboardingStepContextProvider
                stepOrder={[
                  OnboardingStep.CreateUma,
                  OnboardingStep.CreatingTestUmaLoading,
                  OnboardingStep.WalletCustomization,
                ]}
                onFinish={() => {
                  setIsCreatingUma(false);
                  setIsDrawerOpen(false);
                  refreshWallets();
                  toast({
                    title: "New test UMA created",
                  });
                }}
              >
                <StepDrawerTitle />
                <Steps />
              </OnboardingStepContextProvider>
            ) : (
              <UmaSelectorDrawerContent
                wallets={wallets}
                currentWallet={currentWallet}
                handleCreateUma={handleCreateUma}
                handleChooseWallet={handleChooseWallet}
              />
            )}
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
};

const UmaSelectorDrawerContent = ({
  currentWallet,
  wallets,
  handleCreateUma,
  handleChooseWallet,
}: {
  currentWallet: Wallet;
  wallets: Wallet[];
  handleCreateUma: () => void;
  handleChooseWallet: (wallet: Wallet) => void;
}) => {
  const router = useRouter();

  const handleOpenSettings = () => {
    router.push("/settings");
  };

  const hasMaxWallets = wallets.length >= MAX_WALLETS;

  return (
    <>
      <DrawerHeader className="">
        <DrawerTitle className="flex flex-row w-full py-2">
          <div className="flex flex-row w-full justify-between items-center">
            <span className="text-[26px] font-normal leading-[34px] tracking-[-0.325px]">
              Account
            </span>
            <Button variant="icon" size="icon" onClick={handleOpenSettings}>
              <Image
                src="/icons/settings.svg"
                alt="Settings"
                width={24}
                height={24}
              />
            </Button>
          </div>
        </DrawerTitle>
      </DrawerHeader>
      <WalletRows
        currentWallet={currentWallet}
        wallets={wallets}
        handleChooseWallet={handleChooseWallet}
      />
      <div className="flex flex-col px-6 pt-3 pb-12 gap-[10px]">
        <SandboxButton
          buttonProps={{
            size: "lg",
            onClick: handleCreateUma,
          }}
          tooltip={
            hasMaxWallets
              ? "You have reached the maximum number of test UMAs for this account"
              : undefined
          }
          className="w-full gap-2 items-center justify-center"
        >
          <Image
            src="/icons/plus.svg"
            alt="plus"
            width={24}
            height={24}
            className="invert"
          />
          Create a new test UMA
        </SandboxButton>
      </div>
    </>
  );
};

const StepDrawerTitle = () => {
  const { stepProps } = useOnboardingStepContext();
  return (
    <VisuallyHidden>
      <DrawerTitle>{stepProps.title || "Create a new test UMA"}</DrawerTitle>
    </VisuallyHidden>
  );
};
