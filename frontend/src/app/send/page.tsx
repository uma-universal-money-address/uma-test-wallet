"use client";
import { useToast } from "@/hooks/use-toast";
import { useUma } from "@/hooks/useUmaContext";
import { getUmaFromUsername } from "@/lib/uma";
import { type UmaLookupResponse } from "@/types/UmaLookupResponse";
import { useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    step,
    isLoading,
    setStep,
    setIsLoading,
    setUmaLookupResponse,
    setUmaPayreqResponse,
  } = useSendPaymentContext();
  const { umas, isLoading: isLoadingUmas, error: umasError } = useUma();
  const defaultUma = umas.find((uma) => uma.default);

  useEffect(() => {
    const uma = searchParams.get("uma");
    const amount = searchParams.get("amount");

    (async () => {
      if (uma) {
        setIsLoading(true);

        let umaLookupResponse: UmaLookupResponse;
        try {
          umaLookupResponse = await lnurlpLookup(uma);
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
      if (defaultUma) {
        content = <Confirm uma={getUmaFromUsername(defaultUma.username)} />;
      } else if (umasError) {
        toast({
          title: `Failed to fetch user uma: ${umasError}`,
          variant: "error",
        });
        router.push("/wallet");
      }
      break;
    default:
      throw new Error(`Unknown step`);
  }

  return (
    <>
      {(isLoading || isLoadingUmas) && <LoadingOverlay />}
      <div className="flex flex-col h-full w-full overflow-y-scroll">
        {content}
      </div>
    </>
  );
}
