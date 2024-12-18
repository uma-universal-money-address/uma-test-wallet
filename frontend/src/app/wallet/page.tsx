"use client";

import { Wallet } from "@/components/Wallet";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/hooks/useAppState";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { useWallets } from "@/hooks/useWalletContext";
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

  const currentWallet = useAppState((state) => state.currentWallet);
  const [currIndex, setCurrIndex] = useState(-1);
  const [prevIndex, setPrevIndex] = useState(-1);

  if (error) {
    toast({
      title: `Failed to fetch user balance: ${error}`,
      variant: "error",
    });
  }

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
        title: `Failed to load wallet: ${error || exchangeRatesError}`,
        variant: "error",
      });
    }
  }, [error, exchangeRatesError, toast]);

  return (
    <div className="flex flex-col pt-2 px-6 pb-4 gap-6">
      <div className="relative h-[240px]">
        {wallets &&
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
                  }}
                />
              </SlideWallet>
            );
          })}
      </div>
      <TransactionTable />
    </div>
  );
}
