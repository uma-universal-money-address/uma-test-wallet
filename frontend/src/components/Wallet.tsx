"use client";
import { useBalance } from "@/hooks/useBalance";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { convertCurrency } from "@/lib/convertCurrency";
import Image from "next/image";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

interface Props {
  uma: string | undefined;
  isLoading: boolean;
}

export const Wallet = ({ uma, isLoading }: Props) => {
  const {
    balance,
    isLoading: isLoadingBalance,
    error,
  } = useBalance({
    uma,
  });
  const {
    exchangeRates,
    error: exchangeRatesError,
    isLoading: isLoadingExchangeRates,
  } = useExchangeRates();

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span>{error}</span>
      </div>
    );
  }

  let estimate: React.ReactNode = (
    <Skeleton className="w-[30px] h-[24px] rounded-full" />
  );
  if (
    !isLoadingBalance &&
    !isLoadingExchangeRates &&
    balance &&
    exchangeRates
  ) {
    const currencyToEstimate = balance.currency === "USD" ? "SAT" : "USD";
    estimate = convertCurrency(
      exchangeRates,
      { amount: balance.amountInLowestDenom, currencyCode: balance.currency },
      currencyToEstimate,
    ).toLocaleString("en", {
      style: "currency",
      currency: currencyToEstimate,
    });
  } else if (exchangeRatesError) {
    estimate = `Failed to fetch exchange rates: ${exchangeRatesError}`;
  }

  return (
    <div className="flex flex-col text-gray-50 bg-primary gap-6 rounded-3xl shadow-[0px_0px_0px_1px_rgba(0, 0, 0, 0.06), 0px_1px_1px_-0.5px_rgba(0, 0, 0, 0.06), 0px_3px_3px_-1.5px_rgba(0, 0, 0, 0.06), 0px_6px_6px_-3px_rgba(0, 0, 0, 0.06), 0px_12px_12px_-6px_rgba(0, 0, 0, 0.06), 0px_24px_24px_-12px_rgba(0, 0, 0, 0.06);]">
      <div className="flex flex-row items-center text-white opacity-50 justify-between pl-8 pr-[22px] pt-[17px]">
        <span className="text-white">Balance</span>
        <Button variant="ghost">
          <Image
            alt="Plus"
            src="/icons/plus.svg"
            className="invert"
            width={24}
            height={24}
          />
          Add Funds
        </Button>
      </div>
      <div className="flex flex-col gap-2.5 px-8">
        <div className="flex flex-row items-end gap-1">
          <div className="text-5xl font-light leading-[48px] tracking-[-1.92px]">
            {isLoading || isLoadingBalance ? (
              <Skeleton className="w-[120px] h-[48px] rounded-full" />
            ) : (
              balance!.amountInLowestDenom.toLocaleString("en", {
                currency: balance!.currency,
              })
            )}
          </div>
          <div className="text-[15px] font-semibold leading-[20px] tracking-[-0.187px]">
            {isLoading || isLoadingBalance ? (
              <Skeleton className="w-[28px] h-[20px] rounded-full" />
            ) : (
              balance!.currency
            )}
          </div>
        </div>
        <div className="flex flex-row opacity-50 gap-2">About {estimate}</div>
      </div>
      <div className="flex flex-row items-center justify-between px-6 pb-6">
        <Button className="w-full text-white bg-white/[0.12] hover:bg-white/[0.2]">
          Send
        </Button>
      </div>
    </div>
  );
};
