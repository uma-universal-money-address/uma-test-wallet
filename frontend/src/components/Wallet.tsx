"use client";
import { ExchangeRates } from "@/hooks/useExchangeRates";
import { type Wallet as WalletType } from "@/hooks/useWalletContext";
import { getBackendDomain } from "@/lib/backendDomain";
import { convertCurrency } from "@/lib/convertCurrency";
import { convertToNormalDenomination } from "@/lib/convertToNormalDenomination";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SandboxAvatar } from "./SandboxAvatar";
import { Button } from "./ui/button";

interface Props {
  wallet: WalletType | undefined;
  walletIndex: number | undefined;
  exchangeRates: ExchangeRates | undefined;
  isLoading: boolean;
  options?: {
    showAddBalance?: boolean;
    showUma?: boolean;
    showSend?: boolean;
  };
  onboardingStep?: number | undefined;
}

export const Wallet = ({
  wallet,
  walletIndex,
  exchangeRates,
  isLoading,
  options,
  onboardingStep,
}: Props) => {
  const router = useRouter();
  const handleSend = () => {
    router.push("/send");
  };
  const handleFundWallet = () => {
    router.push(
      `/send?fundWallet=true&walletId=${wallet?.id}&toFundCurrency=${JSON.stringify(
        wallet?.currency,
      )}`,
    );
  };

  let estimate: React.ReactNode | null = null;
  if (!isLoading && wallet && exchangeRates) {
    const currencyToEstimate = wallet.currency.code === "SAT" ? "USD" : "SAT";
    if (currencyToEstimate === "SAT") {
      estimate = `${convertCurrency(
        exchangeRates,
        {
          amount: onboardingStep ? 100000 : wallet.amountInLowestDenom,
          currency: wallet.currency,
        },
        currencyToEstimate,
      ).toLocaleString("en", {
        maximumFractionDigits: 0,
      })} sats`;
    } else {
      estimate = convertCurrency(
        exchangeRates,
        {
          amount: onboardingStep ? 100000 : wallet.amountInLowestDenom,
          currency: wallet.currency,
        },
        currencyToEstimate,
      ).toLocaleString("en", {
        style: "currency",
        currency: currencyToEstimate,
      });
    }
  }

  return (
    <div
      style={{
        backgroundColor: wallet ? wallet.color : "rgba(0, 0, 0, 0.3)",
        transition: "background-color 0.3s, height 0.3s",
      }}
      className="flex flex-col justify-between min-h-[214px] text-gray-50 py-6 gap-6 rounded-3xl shadow-[0px_0px_0px_1px_rgba(0, 0, 0, 0.06), 0px_1px_1px_-0.5px_rgba(0, 0, 0, 0.06), 0px_3px_3px_-1.5px_rgba(0, 0, 0, 0.06), 0px_6px_6px_-3px_rgba(0, 0, 0, 0.06), 0px_12px_12px_-6px_rgba(0, 0, 0, 0.06), 0px_24px_24px_-12px_rgba(0, 0, 0, 0.06);]"
    >
      {options?.showUma && wallet && walletIndex ? (
        <div className="flex flex-row items-center justify-between gap-4 px-6">
          <div className="flex flex-row items-center gap-2">
            <SandboxAvatar
              size="md"
              ownContact={{
                wallet,
                number: walletIndex,
              }}
            />
            <div>
              <span className="text-[15px] text-[#F9F9F9] leading-[20px] tracking-[-0.187px]">
                ${wallet.uma.username}
              </span>
              <span className="flex flex-row items-center text-[11px] text-[#F9F9F9] leading-[13px] tracking-[-0.137px] opacity-50">
                @{getBackendDomain()}
                <Image
                  className="pl-[2px] invert opacity-50"
                  alt="uma"
                  src="/uma.svg"
                  width={20}
                  height={10}
                />
              </span>
            </div>
          </div>
          <Button variant="ghost" className="p-0 h-6 opacity-50">
            <Image
              alt="Copy"
              src="/icons/square-behind-square-6.svg"
              className="invert"
              width={24}
              height={24}
            />
          </Button>
        </div>
      ) : (
        <div className="flex flex-row grow items-center text-white opacity-50 justify-between pl-8 h-[26px] pr-[22px]">
          <span className="text-white">Balance</span>
          {options?.showAddBalance && (
            <Button variant="ghost" onClick={handleFundWallet}>
              <Image
                alt="Plus"
                src="/icons/plus.svg"
                className="invert"
                width={24}
                height={24}
              />
              Add Funds
            </Button>
          )}
        </div>
      )}
      <div className="flex flex-col gap-2.5 px-8">
        <div className="flex flex-row items-end gap-1">
          {!isLoading && wallet ? (
            <div className="text-5xl font-light leading-[48px] tracking-[-1.92px] animate-[slideUpSmall_0.4s_ease-in-out_forwards]">
              {onboardingStep
                ? Number(
                    convertToNormalDenomination(100000, wallet.currency),
                  ).toLocaleString("en", {
                    currency: wallet.currency.code,
                  })
                : Number(
                    convertToNormalDenomination(
                      wallet.amountInLowestDenom,
                      wallet.currency,
                    ),
                  ).toLocaleString("en", {
                    currency: wallet.currency.code,
                  })}
            </div>
          ) : (
            <div className="w-[128px] h-[48px]" />
          )}
          {!isLoading && wallet ? (
            <div className="text-[15px] font-semibold leading-[20px] tracking-[-0.187px] animate-[slideUpSmall_0.4s_ease-in-out_forwards]">
              {wallet.currency.code}
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
      {options?.showSend && (
        <div className="flex flex-row items-center justify-between px-6">
          <Button
            className="w-full text-white bg-white/[0.12] hover:bg-white/[0.2]"
            onClick={handleSend}
            size="sm"
          >
            Send
          </Button>
        </div>
      )}
    </div>
  );
};
