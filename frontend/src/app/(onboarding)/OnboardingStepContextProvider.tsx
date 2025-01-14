import { useToast } from "@/hooks/use-toast";
import { Wallet } from "@/hooks/useWalletContext";
import { WalletColor } from "@/lib/walletColorMapping";
import React, { useState } from "react";
import { CreateUma, CreateUmaButtons } from "./CreateUma";
import { CreatingTestUmaLoading } from "./CreatingTestUmaLoading";
import {
  EnableNotifications,
  EnableNotificationsButtons,
} from "./EnableNotifications";
import { Finished, FinishedButtons } from "./Finished";
import { Register, RegisterButtons } from "./Register";
import { StepProps } from "./Steps";
import {
  WalletCustomization,
  WalletCustomizationButtons,
} from "./WalletCustomization";
import { Welcome, WelcomeButtons } from "./Welcome";

export enum OnboardingStep {
  Welcome = "Welcome",
  CreateUma = "CreateUma",
  CreatingTestUmaLoading = "CreatingTestUmaLoading",
  WalletCustomization = "WalletCustomization",
  Register = "Register",
  EnableNotifications = "EnableNotifications",
  Finished = "Finished",
}

export interface OnboardingStepContextData {
  uma: string;
  umaError: string | undefined;
  umaInputMessage: string | undefined;
  wallet?: Wallet;
  walletColor: WalletColor;
  currencyCode: string;
  stepNumber: number;
  history: number[];
  stepProps: StepProps;
  isLoading: boolean;
  onNext: () => void;
  onBack: () => void;
  setUma: (uma: string) => void;
  setUmaError: (umaError: string | undefined) => void;
  setUmaInputMessage: (umaInputMessage: string | undefined) => void;
  setWallet: (wallet: Wallet) => void;
  setWalletColor: (walletColor: WalletColor) => void;
  setCurrencyCode: (currencyCode: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
  /** Resets all step data to the initial state. */
  resetStep: () => void;
  /** Overrides the current step with different step properties */
  overrideStep: (stepProps: StepProps) => void;
}

const OnboardingStepContext = React.createContext<OnboardingStepContextData>(
  null!,
);

export const ONBOARDING_STEP_MAPPING: Record<OnboardingStep, StepProps> = {
  [OnboardingStep.Welcome]: {
    content: Welcome,
    buttons: WelcomeButtons,
  },
  [OnboardingStep.CreateUma]: {
    title: "Create your test UMA",
    description:
      "You'll use this to simulate sending and receiving payments on regtest",
    content: CreateUma,
    buttons: CreateUmaButtons,
    isBackable: true,
  },
  [OnboardingStep.CreatingTestUmaLoading]: {
    content: CreatingTestUmaLoading,
  },
  [OnboardingStep.WalletCustomization]: {
    title: "Your test UMA is ready",
    description:
      "Select a currency to load your UMA with test funds and start making payments on regtest",
    content: WalletCustomization,
    buttons: WalletCustomizationButtons,
  },
  [OnboardingStep.Register]: {
    title: "Save your test UMA",
    description:
      "Create a passkey to securely access your test UMA and funds anytime, anywhere.",
    content: Register,
    buttons: RegisterButtons,
  },
  [OnboardingStep.EnableNotifications]: {
    title: "Enable notifications",
    description: "Get push notifications when you receive payments or requests",
    content: EnableNotifications,
    buttons: EnableNotificationsButtons,
    isSkippable: true,
  },
  [OnboardingStep.Finished]: {
    content: Finished,
    buttons: FinishedButtons,
  },
};

function OnboardingStepContextProvider({
  stepOrder,
  onFinish,
  children,
}: {
  stepOrder: OnboardingStep[];
  onFinish: () => void;
  children: React.ReactNode;
}) {
  const { toast } = useToast();

  const [data, setData] = useState<OnboardingStepContextData>({
    uma: "",
    stepNumber: 0,
    stepProps: ONBOARDING_STEP_MAPPING[stepOrder[0]],
    umaError: undefined,
    umaInputMessage: undefined,
    walletColor: WalletColor.BLACK,
    currencyCode: "SAT",
    history: [],
    isLoading: false,
    onNext: () => {
      setData((prevData) => {
        const nextStepNumber = prevData.stepNumber + 1;
        const nextStepProps =
          ONBOARDING_STEP_MAPPING[stepOrder[nextStepNumber]];
        if (nextStepProps instanceof Function) {
          nextStepProps();
        } else if (nextStepProps) {
          prevData.history.push(prevData.stepNumber);
          return {
            ...prevData,
            stepNumber: nextStepNumber,
            stepProps: nextStepProps,
          };
        } else {
          onFinish();
        }
        return prevData;
      });
    },
    onBack: () => {
      setData((prevData) => {
        const history = prevData.history.slice();
        const prevStepNumber = history.pop();

        if (prevStepNumber !== undefined) {
          const prevStepProps =
            ONBOARDING_STEP_MAPPING[stepOrder[prevStepNumber]];
          return {
            ...prevData,
            stepNumber: prevStepNumber,
            stepProps: prevStepProps,
            history,
          };
        }
        return prevData;
      });
    },
    setUma: (uma) => {
      setData((prevData) => ({ ...prevData, uma }));
    },
    setIsLoading: (isLoading) => {
      setData((prevData) => ({ ...prevData, isLoading }));
    },
    setUmaError: (umaError) => {
      setData((prevData) => ({ ...prevData, umaError }));
    },
    setUmaInputMessage: (umaInputMessage) => {
      setData((prevData) => ({ ...prevData, umaInputMessage }));
    },
    setWallet: (wallet) => {
      setData((prevData) => ({ ...prevData, wallet }));
    },
    setWalletColor: (walletColor) => {
      setData((prevData) => ({
        ...prevData,
        walletColor,
        wallet: {
          ...prevData.wallet!,
          color: walletColor,
        },
      }));
    },
    setCurrencyCode: (currencyCode) => {
      setData((prevData) => ({
        ...prevData,
        currencyCode,
        wallet: {
          ...prevData.wallet!,
          currency: {
            ...prevData.wallet!.currency,
            code: currencyCode,
          },
        },
      }));
    },
    setError: (error) => {
      if (error) {
        toast({
          title: `OnboardingError: ${error.message}`,
          variant: "error",
        });
      }
    },
    resetStep: () => {
      setData((prevData) => ({
        ...prevData,
        uma: "",
        umaError: undefined,
        umaInputMessage: undefined,
        wallet: undefined,
        walletColor: WalletColor.BLACK,
        currencyCode: "SAT",
        stepNumber: 0,
        history: [],
        stepProps: ONBOARDING_STEP_MAPPING[stepOrder[0]],
        isLoading: false,
      }));
    },
    overrideStep: (stepProps: StepProps) => {
      setData((prevData) => ({ ...prevData, stepProps }));
    },
  });

  return (
    <OnboardingStepContext.Provider value={data}>
      {children}
    </OnboardingStepContext.Provider>
  );
}

export function useOnboardingStepContext() {
  return React.useContext(OnboardingStepContext);
}

export default OnboardingStepContextProvider;
