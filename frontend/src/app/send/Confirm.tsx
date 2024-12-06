"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useBalance } from "@/hooks/useBalance";
import { convertToNormalDenomination } from "@/lib/convertToNormalDenomination";
import assert from "assert";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Footer } from "./Footer";
import { useSendPaymentContext } from "./SendPaymentContextProvider";
import { sendPayment } from "./umaRequests";

export const Confirm = () => {
  const { toast } = useToast();
  const router = useRouter();
  const {
    umaLookupResponse,
    umaPayreqResponse,
    senderUma,
    receiverUma,
    isLoading,
    setError,
    setIsLoading,
  } = useSendPaymentContext();
  const { balance, isLoading: isLoadingBalance } = useBalance({
    uma: senderUma,
  });

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
    });

    // Navigate back to the wallet page
    router.push("/wallet");
  };

  const receivingCurrencyCode =
    umaPayreqResponse.receivingCurrencyCode === "SAT"
      ? "sats"
      : umaPayreqResponse.receivingCurrencyCode;

  return (
    <div className="flex flex-col h-full px-8 justify-between">
      <section className="py-8 px-2"></section>
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
              My balance:{" "}
              {balance && !isLoadingBalance ? (
                Number(
                  convertToNormalDenomination(
                    balance.amountInLowestDenom,
                    balance.currency,
                  ),
                ).toLocaleString("en", {
                  currency: balance.currency.code,
                  currencyDisplay: "symbol",
                  style: "currency",
                })
              ) : (
                <Skeleton className="w-[48px] h-[18px] rounded-full" />
              )}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-4 text-primary text-[15px] font-normal leading-[20px] tracking-[-0.187px]">
          <div className="text-secondary flex flex-row justify-between">
            <span>Send to</span>
            <span>{receiverUma}</span>
          </div>
          <div className="text-secondary flex flex-row justify-between">
            <span>Your fees</span>
            <span>
              {Math.round(umaPayreqResponse.exchangeFeesMsats / 1000)} sats
            </span>
          </div>
          <div className="flex flex-row justify-between">
            <span>{"They'll receive"}</span>
            <span>
              {convertToNormalDenomination(
                Number(umaPayreqResponse.amountReceivingCurrency),
                receivingCurrency,
              )}{" "}
              {receivingCurrencyCode}
            </span>
          </div>
          <div className="flex flex-row justify-between">
            <span>{"You'll pay"}</span>
            <span>
              {Math.round(
                (umaPayreqResponse.amountMsats +
                  umaPayreqResponse.exchangeFeesMsats) /
                  1000,
              )}{" "}
              sats
            </span>
          </div>
        </div>
        <Footer
          isLoading={isLoading}
          buttonText="Send"
          onSubmit={handleSubmit}
        />
      </section>
    </div>
  );
};
