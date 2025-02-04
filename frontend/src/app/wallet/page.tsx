"use client";

import { SandboxButton } from "@/components/SandboxButton";
import { Wallet } from "@/components/Wallet";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/hooks/useAppState";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { useWallets } from "@/hooks/useWalletContext";
import Image from "next/image";
import { useEffect, useState } from "react";
import { TransactionTable } from "./TransactionTable";

function SlideWallet({
  prevIndex,
  currIndex,
  walletIndex,
  children,
}: {
  prevIndex: number;
  currIndex: number;
  walletIndex: number;
  children: React.ReactNode;
}) {
  const isSelected = currIndex === walletIndex;
  const wasPrevSelected = prevIndex === walletIndex;
  const firstLoad = prevIndex === -1;

  let animationForSelected = "";
  if (isSelected && !firstLoad) {
    if (prevIndex < currIndex) {
      animationForSelected = "animate-[slideLeft_0.4s_ease-in-out_forwards]";
    } else {
      animationForSelected = "animate-[slideRight_0.4s_ease-in-out_forwards]";
    }
  }

  let animationForPrevSelected = "";
  if (wasPrevSelected && !firstLoad) {
    if (prevIndex < currIndex) {
      animationForPrevSelected =
        "animate-[slideOutLeft_0.4s_ease-in-out_forwards]";
    } else {
      animationForPrevSelected =
        "animate-[slideOutRight_0.4s_ease-in-out_forwards]";
    }
  }

  return (
    <div
      className={`absolute w-full ${
        animationForSelected || animationForPrevSelected
      } ${!isSelected && !wasPrevSelected ? "hidden" : ""}`}
    >
      {children}
    </div>
  );
}

export default function Page() {
  const { toast } = useToast();
  const { wallets, isLoading: isLoadingWallets, error } = useWallets();
  const {
    exchangeRates,
    error: exchangeRatesError,
    isLoading: isLoadingExchangeRates,
  } = useExchangeRates();
  const { currentWallet, setIsCreateUmaDialogOpen } = useAppState();

  const [currIndex, setCurrIndex] = useState(-1);
  const [prevIndex, setPrevIndex] = useState(-1);

  useEffect(() => {
    if (currentWallet && wallets && wallets.length > 0) {
      const currWalletIndex = wallets.findIndex(
        (wallet) => wallet.id === currentWallet.id,
      );
      if (currIndex !== currWalletIndex) {
        setPrevIndex(currIndex);
        setCurrIndex(currWalletIndex);
      }
    }
  }, [wallets, currIndex, currentWallet]);

  useEffect(() => {
    if (error || exchangeRatesError) {
      toast({
        description: `Failed to load wallet: ${error || exchangeRatesError}`,
        variant: "error",
      });
    }
  }, [error, exchangeRatesError, toast]);

  return (
    <div className="flex flex-col pt-2 px-6 pb-4 gap-6">
      <div className="relative h-[240px]">
        {!isLoadingWallets &&
          (wallets && wallets.length > 0 ? (
            wallets.map((wallet, index) => {
              return (
                <SlideWallet
                  key={wallet.id}
                  prevIndex={prevIndex}
                  currIndex={currIndex}
                  walletIndex={index}
                >
                  <Wallet
                    wallet={wallet}
                    walletIndex={index}
                    exchangeRates={exchangeRates}
                    isLoading={isLoadingWallets || isLoadingExchangeRates}
                    options={{
                      showAddBalance: true,
                      showSend: true,
                      showBalance: true,
                      showHeader: true,
                    }}
                  />
                </SlideWallet>
              );
            })
          ) : (
            <div className="flex flex-col w-full items-center justify-center animate-[fadeInAndSlideDown_0.5s_ease-in-out_forwards]">
              <div className="relative pb-5">
                <div className="p-5 border border-[#DDE3F3] rounded-[40px]">
                  <Image
                    src="/wallet-loading-animation.svg"
                    alt="Loading animation"
                    width={305}
                    height={184}
                  />
                </div>

                <div
                  className="absolute bottom-0 left-0 h-full w-full"
                  style={{
                    background:
                      "linear-gradient(rgba(255, 255, 255, 0) 0.14%, hsl(var(--background)))",
                  }}
                ></div>
              </div>
              <div className="flex flex-col gap-2 items-center text-center w-full pb-8">
                <span className="text-[22px] font-normal leading-[28px] tracking-[-.275px]">
                  The world is your sandbox
                </span>
                <span className="text-secondary text-[15px] font-normal leading-[20px] tracking-[-.187px]">
                  Create a new test UMA to start simulating payments on regtest
                </span>
              </div>

              <SandboxButton
                buttonProps={{
                  size: "lg",
                  onClick: () => setIsCreateUmaDialogOpen(true),
                }}
                className="w-fit"
              >
                <Image
                  src="/icons/plus.svg"
                  alt="Plus icon"
                  width={24}
                  height={24}
                  className="invert"
                />
                <span className="text-[16px] font-semibold leading-[21px] tracking-[-.2px]">
                  New test UMA
                </span>
              </SandboxButton>
            </div>
          ))}
      </div>
      <TransactionTable />
    </div>
  );
}
