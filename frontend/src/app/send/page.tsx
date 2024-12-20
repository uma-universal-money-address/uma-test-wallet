"use client";
import { useToast } from "@/hooks/use-toast";
import { type UmaLookupResponse } from "@/types/UmaLookupResponse";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Confirm } from "./Confirm";
import { EnterAmount } from "./EnterAmount";
import { LoadingOverlay } from "./LoadingOverlay";
import { SelectRecipient } from "./SelectRecipient";
import {
  SendPaymentStep,
  useSendPaymentContext,
} from "./SendPaymentContextProvider";
import { createPayreq, lnurlpLookup } from "./umaRequests";

export default function Page() {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <PageContent />
    </Suspense>
  );
}

function PageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const {
    step,
    senderUma,
    isLoading,
    setStep,
    setIsLoading,
    setUmaLookupResponse,
    setUmaPayreqResponse,
  } = useSendPaymentContext();

  useEffect(() => {
    const uma = searchParams.get("uma");
    const amount = searchParams.get("amount");
    const fundWallet = searchParams.get("fundWallet");
    const toFundCurrency = searchParams.get("toFundCurrency");
    const walletId = searchParams.get("walletId");
    (async () => {
      if (fundWallet && toFundCurrency && walletId) {
        const currency = JSON.parse(toFundCurrency);
        setUmaLookupResponse({
          receiverCurrencies: [currency],
          senderCurrencies: [currency],
          minSendableMsats: 0,
          maxSendableMsats: 0,
          callbackUuid: "",
          receiverKycStatus: "",
        });
        setStep(SendPaymentStep.FundWallet);
        return;
      }

      if (uma) {
        setIsLoading(true);

        let umaLookupResponse: UmaLookupResponse;
        try {
          umaLookupResponse = await lnurlpLookup(senderUma, uma);
          setUmaLookupResponse(umaLookupResponse);
        } catch (e: unknown) {
          const error = e as Error;
          toast({
            title: `Failed lnurlp lookup: ${error.message}`,
            variant: "error",
          });
          setIsLoading(false);
          return;
        }
        setUmaLookupResponse(umaLookupResponse);

        if (amount) {
          const payreqResponse = await createPayreq(
            umaLookupResponse.callbackUuid,
            parseInt(amount, 10),
            "SAT",
          );
          setUmaPayreqResponse(payreqResponse);
          setStep(SendPaymentStep.Confirm);
        } else {
          setStep(SendPaymentStep.EnterAmount);
        }

        setIsLoading(false);
      }
    })();
  }, [
    searchParams,
    senderUma,
    setStep,
    setIsLoading,
    setUmaLookupResponse,
    setUmaPayreqResponse,
    toast,
  ]);

  let content;
  switch (step) {
    case SendPaymentStep.SelectRecipient:
      content = <SelectRecipient />;
      break;
    case SendPaymentStep.EnterAmount:
      content = <EnterAmount />;
      break;
    case SendPaymentStep.Confirm:
      content = <Confirm />;
      break;
    case SendPaymentStep.FundWallet:
      content = <EnterAmount />;
      break;
    default:
      throw new Error(`Unknown step`);
  }

  return (
    <>
      {isLoading && <LoadingOverlay />}
      <div className="flex flex-col h-full w-full overflow-y-scroll">
        {content}
      </div>
    </>
  );
}
