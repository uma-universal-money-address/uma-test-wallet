"use client";
import { useToast } from "@/hooks/use-toast";
import { useBalance } from "@/hooks/useBalance";
import { ExchangeRates } from "@/hooks/useExchangeRates";
import { type Wallet as WalletType } from "@/hooks/useWalletContext";
import { convertCurrency } from "@/lib/convertCurrency";
import { convertToNormalDenomination } from "@/lib/convertToNormalDenomination";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

interface Props {
  uma: string | undefined;
  wallet: WalletType | undefined;
  exchangeRates: ExchangeRates | undefined;
  isLoading: boolean;
}

export const Wallet = ({ uma, wallet, exchangeRates, isLoading }: Props) => {
  const router = useRouter();
  const { toast } = useToast();
  const {
    balance,
    isLoading: isLoadingBalance,
    error,
  } = useBalance({
    uma,
  });

  if (error) {
    toast({
      title: `Failed to fetch user balance: ${error}`,
      variant: "error",
    });
  }

  const handleSend = () => {
    router.push("/send");
  };

  let estimate: React.ReactNode | null = null;
  if (!isLoadingBalance && balance && exchangeRates) {
    const currencyToEstimate = balance.currency.code === "USD" ? "SAT" : "USD";
    estimate = convertCurrency(
      exchangeRates,
      {
        amount: balance.amountInLowestDenom,
        currencyCode: balance.currency.code,
      },
      currencyToEstimate,
    ).toLocaleString("en", {
      style: "currency",
      currency: currencyToEstimate,
    });
  }

  return (
    <div
      style={{
        backgroundColor: wallet ? wallet.color : "rgba(0, 0, 0, 0.3)",
        transition: "background-color 0.3s",
      }}
      className="flex flex-col text-gray-50 py-6 gap-6 rounded-3xl shadow-[0px_0px_0px_1px_rgba(0, 0, 0, 0.06), 0px_1px_1px_-0.5px_rgba(0, 0, 0, 0.06), 0px_3px_3px_-1.5px_rgba(0, 0, 0, 0.06), 0px_6px_6px_-3px_rgba(0, 0, 0, 0.06), 0px_12px_12px_-6px_rgba(0, 0, 0, 0.06), 0px_24px_24px_-12px_rgba(0, 0, 0, 0.06);]"
    >
      <div className="flex flex-row items-center text-white opacity-50 justify-between pl-8 h-[26px] pr-[22px]">
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
          {!isLoading && !isLoadingBalance && balance ? (
            <div className="text-5xl font-light leading-[48px] tracking-[-1.92px] animate-[slideUpSmall_0.4s_ease-in-out_forwards]">
              {Number(
                convertToNormalDenomination(
                  balance.amountInLowestDenom,
                  balance.currency,
                ),
              ).toLocaleString("en", {
                currency: balance.currency.code,
              })}
            </div>
          ) : (
            <div className="w-[128px] h-[48px]" />
          )}
          {!isLoading && !isLoadingBalance && balance ? (
            <div className="text-[15px] font-semibold leading-[20px] tracking-[-0.187px] animate-[slideUpSmall_0.4s_ease-in-out_forwards]">
              {balance.currency.code}
            </div>
          ) : (
            <div className="w-[28px] h-[20px]" />
          )}
        </div>
        {estimate !== null && (
          <div className="flex flex-row opacity-50 text-[13px] leading-[18px] tracking-[-0.162px] gap-2 animate-[slideLeftSmall_0.4s_ease-in-out_forwards]">
            About {estimate}
          </div>
        )}
      </div>
      <div className="flex flex-row items-center justify-between px-6">
        <Button
          className="w-full text-white bg-white/[0.12] hover:bg-white/[0.2]"
          onClick={handleSend}
          size="sm"
        >
          Send
        </Button>
      </div>
    </div>
  );
};
