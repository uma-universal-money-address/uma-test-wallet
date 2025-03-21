"use client";

import { TestWalletButton } from "@/components/TestWalletButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { UmaInput } from "@/components/UmaInput";
import { Wallet } from "@/components/Wallet";
import { useToast } from "@/hooks/use-toast";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { fetchWallets, Wallet as WalletType } from "@/hooks/useWalletContext";
import { fundWallet } from "@/lib/fundWallet";
import { updateWallet } from "@/lib/updateWallet";
import { WalletColor } from "@/lib/walletColorMapping";
import { AVAILABLE_CURRENCIES } from "@/types/Currency";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useOnboardingStepContext } from "./OnboardingStepContextProvider";
import { StepButtonProps } from "./Steps";

const OtherCurrencies = ({
  handleClose,
  handleUpdateCurrency,
}: {
  handleClose: () => void;
  handleUpdateCurrency: (currencyCode: string) => Promise<void>;
}) => {
  const { toast } = useToast();
  const {
    currencies,
    isLoading: isLoadingCurrencies,
    error: currenciesError,
  } = useCurrencies();
  const { wallet } = useOnboardingStepContext();
  const [search, setSearch] = useState("");

  const handleChooseCurrency = (code: string) => async () => {
    await handleUpdateCurrency(code);
    handleClose();
  };

  const handleSearchCurrency = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    setSearch(search || "");
  };

  const filteredCurrencies =
    currencies
      ?.filter((currency) => AVAILABLE_CURRENCIES.has(currency.code))
      .filter((currency) =>
        currency.code.toLowerCase().includes(search.toLowerCase()),
      ) || [];

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  useEffect(() => {
    if (currenciesError) {
      toast({
        description: `Failed to load currencies: ${currenciesError}`,
        variant: "error",
      });
    }
  }, [toast, currenciesError]);

  return (
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <VisuallyHidden.Root>
        <DialogTitle>Select preferred currency</DialogTitle>
        <DialogDescription>
          Cross-currency payments sent to your UMA will arrive in your preferred
          currency.
        </DialogDescription>
      </VisuallyHidden.Root>
      <DialogContent className="min-w-[300px] max-sm:h-full max-h-[916px] overflow-scroll justify-start">
        <div className="flex flex-col gap-2 px-8 pb-3 pt-[68px]">
          <h1 className="text-primary text-[26px] font-normal leading-[34px] tracking-[-0.325px]">
            Select preferred currency
          </h1>
          <p className="text-secondary text-[15px] font-normal leading-[20px] tracking-[-0.187px]">
            Cross-currency payments sent to your UMA will arrive in your
            preferred currency.
          </p>
        </div>
        <div className="flex flex-col w-full gap-3 px-8">
          <UmaInput
            inputProps={{
              placeholder: "Search currency",
              onChange: handleSearchCurrency,
              value: search,
            }}
          />
          {!isLoadingCurrencies && currencies && (
            <div className="flex flex-col gap-2 pb-6 animate-[fadeInAndSlideDown_0.5s_ease-in-out_forwards]">
              {filteredCurrencies.map((currency) => {
                return (
                  <div
                    key={currency.code}
                    className="w-full flex flex-row gap-4 py-5"
                    onClick={handleChooseCurrency(currency.code)}
                  >
                    <Image
                      src={`/icons/currency_flags/${currency.code.toUpperCase()}.svg`}
                      alt={currency.code}
                      width={32}
                      height={32}
                      className="rounded-full w-8 h-8"
                    />
                    <div className="flex flex-row gap-1 align-center grow justify-between">
                      <div className="flex flex-col gap-[2px]">
                        <span className="text-primary text-[16px] font-semibold leading-[21px] tracking-[-0.2px]">
                          {currency.code}
                        </span>
                        <span className="text-secondary text-[12px] font-normal leading-[16px] tracking-[-0.15px]">
                          {currency.name}
                        </span>
                      </div>
                      <div>
                        {wallet?.currency.code === currency.code ? (
                          <div className="w-6 h-6">
                            <Image
                              src="/icons/checkmark.svg"
                              alt="selected"
                              width={20}
                              height={20}
                            />
                          </div>
                        ) : (
                          <div className="w-6 h-6"></div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CurrencyOptions = () => {
  const { wallet, setError, setWallet, setCurrencyCode } =
    useOnboardingStepContext();
  const [isOtherCurrencyOpen, setIsOtherCurrencyOpen] = useState(false);

  const handleOtherCurrency = () => {
    setIsOtherCurrencyOpen(true);
  };

  const handleUpdateCurrency = async (currencyCode: string) => {
    setError(null);

    if (!wallet) {
      setError(new Error("Wallet is missing."));
      return;
    }

    try {
      const res = await updateWallet(wallet.id, {
        currencyCode,
      });
      if (!res) {
        setError(new Error("Failed to update wallet currency."));
      }
      setWallet(res);
      setCurrencyCode(currencyCode);
    } catch (e) {
      const error = e as unknown as Error;
      console.error(error);
      setError(error);
    }
  };

  const isSat = wallet?.currency.code === "SAT";
  const isUsd = wallet?.currency.code === "USD";
  const isOtherSelected = !isSat && !isUsd;

  return (
    <>
      {isOtherCurrencyOpen && (
        <OtherCurrencies
          handleClose={() => setIsOtherCurrencyOpen(false)}
          handleUpdateCurrency={handleUpdateCurrency}
        />
      )}
      <div className="flex flex-row w-full max-w-[340px] h-10 justify-between px-2 pb-5 gap-2">
        <Button
          variant={isSat ? "default" : "currency"}
          size="flat"
          className="w-full rounded-lg"
          onClick={() => handleUpdateCurrency("SAT")}
        >
          SAT
        </Button>
        <Button
          variant={isUsd ? "default" : "currency"}
          size="flat"
          className="w-full rounded-lg"
          onClick={() => handleUpdateCurrency("USD")}
        >
          USD
        </Button>
        <Button
          variant={isOtherSelected ? "default" : "currency"}
          size="flat"
          className="w-full rounded-lg gap-0 flex flex-row justify-end"
          onClick={handleOtherCurrency}
        >
          Other
          <Image
            src="/icons/chevron-down-small.svg"
            alt="other dropdown"
            className={`opacity-50 ${isOtherSelected ? "invert" : ""}`}
            width={20}
            height={20}
          />
        </Button>
      </div>
    </>
  );
};

export const WalletCustomization = () => {
  const { toast } = useToast();
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [isLoadingWallets, setIsLoadingWallets] = useState(true);
  const [walletsError, setWalletsError] = useState<string | undefined>();
  const { wallet, walletColor, setWalletColor, setError, stepNumber } =
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
          description: `Failed to load wallets: ${error}`,
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
        description: `Failed to load wallet customization: ${error}`,
        variant: "error",
      });
    }
  }, [walletsError, exchangeRatesError, toast]);

  const handleUpdateColor = async (color: WalletColor) => {
    setError(null);

    if (!wallet) {
      setError(new Error("Wallet is missing."));
      return;
    }

    try {
      setWalletColor(color);
      const res = await updateWallet(wallet.id, {
        color,
      });
      if (!res) {
        setError(new Error("Failed to update wallet color."));
      }
    } catch (e) {
      const error = e as unknown as Error;
      console.error(error);
      setError(error);
    }
  };
  return (
    <div className="flex flex-col h-full items-center px-6 pb-3">
      <div className="w-full pb-5">
        <Wallet
          onboardingStep={stepNumber}
          wallet={wallet}
          walletIndex={wallets.length}
          exchangeRates={exchangeRates}
          isLoading={isLoadingExchangeRates || isLoadingWallets}
          options={{
            showUma: true,
            showBalance: true,
            showHeader: true,
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
              onClick={() => handleUpdateColor(color)}
            />
          );
        })}
      </div>
      <CurrencyOptions />
    </div>
  );
};

export const WalletCustomizationButtons = ({ onNext }: StepButtonProps) => {
  const { wallet } = useOnboardingStepContext();

  const handleFinishStep = async () => {
    if (wallet) {
      await fundWallet(wallet.id, {
        currencyCode: wallet.currency.code,
        amountInLowestDenom: 100000,
      });
    }
    onNext();
  };

  return (
    <div className="flex flex-col gap-[10px]">
      <TestWalletButton
        buttonProps={{
          size: "lg",
          onClick: handleFinishStep,
        }}
        className="w-full"
      >
        Add test funds
      </TestWalletButton>
    </div>
  );
};
