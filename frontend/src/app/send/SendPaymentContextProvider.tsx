import { useToast } from "@/hooks/use-toast";
import { type UmaLookupResponse } from "@/types/UmaLookupResponse";
import { type UmaPayreqResponse } from "@/types/UmaPayreqResponse";
import React, { useState } from "react";

export enum SendPaymentStep {
  SelectRecipient = "SelectRecipient",
  EnterAmount = "EnterAmount",
  Confirm = "Confirm",
  FundWallet = "FundWallet",
}

export interface SendPaymentContextData {
  step: SendPaymentStep;
  senderUma: string;
  receiverUma: string;
  umaLookupResponse?: UmaLookupResponse;
  umaPayreqResponse?: UmaPayreqResponse;
  history: SendPaymentStep[];
  isLoading: boolean;
  amount: number;
  onNext: () => void;
  onBack: () => void;
  setStep: (step: SendPaymentStep) => void;
  setReceiverUma: (uma: string) => void;
  setAmount: (amount: number) => void;
  setUmaLookupResponse: (res: UmaLookupResponse) => void;
  setUmaPayreqResponse: (res: UmaPayreqResponse) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
}

const SendPaymentContext = React.createContext<SendPaymentContextData>(null!);

const STEP_MAPPING: Record<SendPaymentStep, SendPaymentStep | undefined> = {
  [SendPaymentStep.SelectRecipient]: SendPaymentStep.EnterAmount,
  [SendPaymentStep.EnterAmount]: SendPaymentStep.Confirm,
  [SendPaymentStep.Confirm]: undefined,
  [SendPaymentStep.FundWallet]: undefined,
};

const FIRST_STEP = SendPaymentStep.SelectRecipient;

function SendPaymentContextProvider({
  senderUma,
  children,
}: {
  senderUma: string;
  children: React.ReactNode;
}) {
  const { toast } = useToast();
  const [data, setData] = useState<SendPaymentContextData>({
    step: FIRST_STEP,
    senderUma,
    receiverUma: "",
    amount: 0,
    history: [],
    isLoading: false,
    onNext: () => {
      setData((prevData) => {
        if (STEP_MAPPING[prevData.step]) {
          prevData.history.push(prevData.step);
          return {
            ...prevData,
            step: STEP_MAPPING[prevData.step]!,
          };
        }
        return prevData;
      });
    },
    onBack: () => {
      setData((prevData) => {
        const history = prevData.history.slice();
        const step = history.pop();

        if (step) {
          return { ...prevData, step, history };
        }
        return prevData;
      });
    },
    setStep: (step) => {
      setData((prevData) => {
        // Always go back to the first step if directly setting the step
        prevData.history.push(FIRST_STEP);
        return { ...prevData, step };
      });
    },
    setReceiverUma: (receiverUma) => {
      setData((prevData) => ({ ...prevData, receiverUma }));
    },
    setAmount: (amount) => {
      setData((prevData) => ({ ...prevData, amount }));
    },
    setUmaLookupResponse: (umaLookupResponse) => {
      setData((prevData) => ({ ...prevData, umaLookupResponse }));
    },
    setUmaPayreqResponse: (umaPayreqResponse) => {
      setData((prevData) => ({ ...prevData, umaPayreqResponse }));
    },
    setIsLoading: (isLoading) => {
      setData((prevData) => ({ ...prevData, isLoading }));
    },
    setError: (error) => {
      if (error) {
        toast({
          title: `SendError: ${error.message}`,
          variant: "error",
        });
      }
    },
  });

  return (
    <SendPaymentContext.Provider value={data}>
      {children}
    </SendPaymentContext.Provider>
  );
}

export function useSendPaymentContext() {
  return React.useContext(SendPaymentContext);
}

export default SendPaymentContextProvider;
