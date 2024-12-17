"use client";

import { SandboxButton } from "@/components/SandboxButton";
import { Wallet } from "@/components/Wallet";
import { useToast } from "@/hooks/use-toast";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { fetchWallets, Wallet as WalletType } from "@/hooks/useWalletContext";
import { getUmaFromUsername } from "@/lib/uma";
import { updateWallet } from "@/lib/updateWallet";
import { WalletColor } from "@/lib/walletColorMapping";
import { useEffect, useState } from "react";
import { useOnboardingStepContext } from "./OnboardingStepContextProvider";
import { StepButtonProps } from "./Step";

export const WalletCustomization = () => {
  const { toast } = useToast();
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [isLoadingWallets, setIsLoadingWallets] = useState(true);
  const [walletsError, setWalletsError] = useState<string | undefined>();
  const { uma, wallet, walletColor, setWalletColor } =
    useOnboardingStepContext();
  const {
    exchangeRates,
    isLoading: isLoadingExchangeRates,
    error: exchangeRatesError,
  } = useExchangeRates();

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const wallets = await fetchWallets();
        if (!ignore) {
          setWallets(wallets);
          setIsLoadingWallets(false);
        }
      } catch (error) {
        console.error(error);
        toast({
          title: `Failed to load wallets: ${error}`,
          variant: "error",
        });
        setIsLoadingWallets(false);
        setWalletsError("Failed to load wallets.");
      }
    })();
    return () => {
      ignore = true;
    };
  }, [toast]);

  useEffect(() => {
    const error = walletsError || exchangeRatesError;
    if (error) {
      toast({
        title: `Failed to load wallet customization: ${error}`,
        variant: "error",
      });
    }
  }, [walletsError, exchangeRatesError, toast]);

  return (
    <div className="flex flex-col h-full w-full items-center px-6 pb-3">
      <div className="w-full pt-4 pb-5">
        <Wallet
          uma={getUmaFromUsername(uma)}
          wallet={wallet}
          walletIndex={wallets.length}
          exchangeRates={exchangeRates}
          isLoading={isLoadingExchangeRates || isLoadingWallets}
          options={{
            showUma: true,
          }}
        />
      </div>
      <div className="flex flex-row w-full max-w-[340px] justify-between px-2 pb-5">
        {Object.values(WalletColor).map((color) => {
          return (
            <button
              key={color}
              className={`w-6 h-6 rounded-full cursor-pointer ${
                walletColor === color
                  ? "outline-offset-[-6px] outline-2 outline outline-white"
                  : ""
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setWalletColor(color)}
            />
          );
        })}
      </div>
    </div>
  );
};

export const WalletCustomizationButtons = ({ onNext }: StepButtonProps) => {
  const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
  const { wallet, walletColor, setError } = useOnboardingStepContext();

  const handleSubmit = async () => {
    setError(null);

    if (!wallet) {
      setError(new Error("Wallet is missing."));
      return;
    }

    setIsLoadingSubmit(true);
    try {
      const res = await updateWallet(wallet.id, { color: walletColor });
      if (!res) {
        setError(new Error("Failed to update wallet."));
      }
      onNext();
    } catch (e) {
      const error = e as unknown as Error;
      console.error(error);
      setError(error);
    } finally {
      setIsLoadingSubmit(false);
    }
  };

  return (
    <div className="flex flex-col gap-[10px]">
      <SandboxButton
        buttonProps={{
          size: "lg",
          onClick: handleSubmit,
        }}
        loading={isLoadingSubmit}
        className="w-full"
      >
        Continue
      </SandboxButton>
    </div>
  );
};
