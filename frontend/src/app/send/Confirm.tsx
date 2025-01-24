"use client";
import { OwnContact, SandboxAvatar } from "@/components/SandboxAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useBalance } from "@/hooks/useBalance";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { useWallets } from "@/hooks/useWalletContext";
import { convertCurrency } from "@/lib/convertCurrency";
import { convertToNormalDenomination } from "@/lib/convertToNormalDenomination";
import { flagExists, getCurrencyFlagFromCode } from "@/lib/currencyFlagMapping";
import { smartRound } from "@/lib/smartRound";
import { getUmaFromUsername } from "@/lib/uma";
import assert from "assert";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Footer } from "./Footer";
import { useSendPaymentContext } from "./SendPaymentContextProvider";
import { sendPayment } from "./umaRequests";

const satsToCurrency = (
  amount: number,
  exchangeRate: number | undefined,
  currencyCode: string,
) => {
  if (!exchangeRate) return `${Math.round(amount)} sats`;
  return `${smartRound(
    convertCurrency(
      { [currencyCode]: exchangeRate },
      {
        amount,
        currency: { code: "SAT", name: "Satoshi", symbol: "sats", decimals: 2 },
      },
      currencyCode,
    ),
  )} ${currencyCode}`;
};

export const Confirm = () => {
  const { toast } = useToast();
  const { wallets } = useWallets();
  const router = useRouter();
  const {
    umaLookupResponse,
    umaPayreqResponse,
    senderUma,
    receiverUma,
    setError,
  } = useSendPaymentContext();
  const [isLoading, setIsLoading] = useState(false);
  const { balance, isLoading: isLoadingBalance } = useBalance({
    uma: senderUma,
  });
  const {
    exchangeRates,
    error: exchangeRatesError,
    isLoading: isLoadingExchangeRates,
  } = useExchangeRates();

  assert(umaLookupResponse);
  assert(umaPayreqResponse);
  const receivingCurrency = umaLookupResponse.receiverCurrencies.find(
    (currency) => currency.code === umaPayreqResponse.receivingCurrencyCode,
  );
  assert(receivingCurrency);

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await sendPayment(umaPayreqResponse);
      setIsLoading(false);
    } catch (e: unknown) {
      const error = e as Error;
      console.error(error);
      setError(error);
      setIsLoading(false);
      return;
    }

    toast({
      title: `You paid ${receiverUma}`,
      variant: "default",
    });

    // Navigate back to the wallet page
    router.push("/wallet");
  };

  const senderWallet: OwnContact | undefined = useMemo(() => {
    if (!wallets) return undefined;
    const index = wallets.findIndex(
      (wallet) => getUmaFromUsername(wallet.uma.username) === senderUma,
    );
    if (index === -1) return undefined;
    return {
      wallet: wallets[index],
      number: index + 1,
    };
  }, [wallets, senderUma]);

  const receiverWallet: OwnContact | undefined = useMemo(() => {
    if (!wallets) return undefined;
    const index = wallets.findIndex(
      (wallet) => getUmaFromUsername(wallet.uma.username) === receiverUma,
    );
    if (index === -1) return undefined;
    return {
      wallet: wallets[index],
      number: index + 1,
    };
  }, [wallets, receiverUma]);

  const receivingCurrencyCode =
    umaPayreqResponse.receivingCurrencyCode === "SAT"
      ? "sats"
      : umaPayreqResponse.receivingCurrencyCode;

  return (
    <div className="flex flex-col h-full px-8 justify-between">
      <section className="py-8 px-2">
        <div className="flex flex-col bg-[#f9f9f9] w-full rounded-3xl border-[0.33px] border-[#C0C9D6] p-6">
          <div className="flex items-center gap-3">
            <SandboxAvatar
              size="lg"
              ownContact={senderWallet}
              country={
                balance?.currency && flagExists(balance.currency.code)
                  ? {
                      umaUserName: senderUma,
                      image: getCurrencyFlagFromCode(balance.currency.code),
                      currency: balance.currency,
                    }
                  : undefined
              }
            />
            <div className="flex flex-col gap-1">
              <span className="text-secondary text-[15px] font-normal leading-[20px] tracking-[-0.187px]">
                From
              </span>
              <span className="text-primary text-[15px] font-semibold leading-[20px] tracking-[-0.187px]">
                {senderUma}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6 py-3 pl-3">
            <Image
              src="/icons/arrow-down.svg"
              alt="arrow down"
              width={24}
              height={24}
            />
            <div className="h-[0.33px] w-full bg-[#C0C9D6]" />
          </div>
          <div className="flex items-center gap-3">
            <SandboxAvatar
              size="lg"
              ownContact={receiverWallet}
              uma={receiverUma}
              country={
                flagExists(receivingCurrency.code)
                  ? {
                      umaUserName: receiverUma,
                      image: getCurrencyFlagFromCode(receivingCurrency.code),
                      currency: receivingCurrency,
                    }
                  : undefined
              }
            />
            <div className="flex flex-col gap-1">
              <span className="text-secondary text-[15px] font-normal leading-[20px] tracking-[-0.187px]">
                To
              </span>
              <span className="text-primary text-[15px] font-semibold leading-[20px] tracking-[-0.187px]">
                {receiverUma}
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="flex flex-col">
        <div className="flex flex-row pt-4 pb-4 gap-3 border-b border-[#ebeef2] mb-6">
          <div className="border-[0.5px] border-[#C0C6CE] rounded-lg bg-[#F9F9F9] py-[10px] px-5">
            <Image
              alt="Payment method"
              src="/icons/payment-method.svg"
              width={24}
              height={24}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-secondary text-[15px] font-normal leading-[20px] tracking-[-0.187px]">
              Pay with
            </span>
            <span className="text-primary text-[15px] font-semibold leading-[20px] tracking-[-0.187px] flex flex-row gap-1 items-center">
              Balance:{" "}
              {balance && !isLoadingBalance ? (
                Number(
                  convertToNormalDenomination(
                    balance.amountInLowestDenom,
                    balance.currency,
                  ),
                ).toLocaleString("en") +
                " " +
                balance.currency.code
              ) : (
                <Skeleton className="w-[48px] h-[18px] rounded-full" />
              )}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-4 text-primary text-[15px] font-normal leading-[20px] tracking-[-0.187px]">
          <div className="text-secondary flex flex-row justify-between">
            <span>{"You're converting"}</span>
            <span>
              {balance && !isLoadingBalance ? (
                <div className="flex flex-row gap-2">
                  <span>{balance.currency.code}</span>
                  <Image
                    src="/icons/arrow-right.svg"
                    alt="arrow right"
                    width={20}
                    height={20}
                  />
                  <span>{receivingCurrency.code}</span>
                </div>
              ) : (
                <Skeleton className="w-[48px] h-[18px] rounded-full" />
              )}
            </span>
          </div>
          <div className="text-secondary flex flex-row justify-between">
            <span>Conversion rate</span>
            {exchangeRates &&
            !exchangeRatesError &&
            !isLoadingExchangeRates &&
            balance?.currency &&
            !isLoadingBalance ? (
              <span>
                1 {balance.currency.code} ={" "}
                {smartRound(
                  convertCurrency(
                    exchangeRates,
                    { amount: 1, currency: balance.currency },
                    receivingCurrency.code,
                  ),
                )}{" "}
                {receivingCurrency.code}
              </span>
            ) : (
              <Skeleton className="w-[48px] h-[18px] rounded-full" />
            )}
          </div>
          <div className="text-secondary flex flex-row justify-between">
            <span>Your fees</span>
            <span>
              {satsToCurrency(
                umaPayreqResponse.exchangeFeesMsats / 1000,
                exchangeRates?.[balance?.currency.code || ""],
                balance?.currency.code || "",
              )}
            </span>
          </div>
          <div className="text-primary text-[15px] font-semibold leading-[20px] tracking-[-0.187px] flex flex-row justify-between">
            <span>{"They'll receive"}</span>
            <span>
              {satsToCurrency(
                umaPayreqResponse.amountMsats / 1000,
                exchangeRates?.[balance?.currency.code || ""],
                balance?.currency.code || "",
              )}{" "}
              (
              {convertToNormalDenomination(
                Number(umaPayreqResponse.amountReceivingCurrency),
                receivingCurrency,
              )}{" "}
              {receivingCurrencyCode})
            </span>
          </div>
          <div className="text-primary text-[15px] font-semibold leading-[20px] tracking-[-0.187px] flex flex-row justify-between">
            <span>{"You'll pay"}</span>
            <span>
              {satsToCurrency(
                (umaPayreqResponse.amountMsats +
                  umaPayreqResponse.exchangeFeesMsats) /
                  1000,
                exchangeRates?.[balance?.currency.code || ""],
                balance?.currency.code || "",
              )}
            </span>
          </div>
        </div>
        <Footer
          isLoading={isLoading}
          buttonText="Send payment"
          onSubmit={handleSubmit}
        />
      </section>
    </div>
  );
};
