"use client";

import { InfoRow } from "@/components/InfoRow";
import { SandboxButton } from "@/components/SandboxButton";
import { Wallet } from "@/components/Wallet";
import { useToast } from "@/hooks/use-toast";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { fetchWallets, Wallet as WalletType } from "@/hooks/useWalletContext";
import { getBackendUrl } from "@/lib/backendUrl";
import { startRegistration } from "@simplewebauthn/browser";
import { useEffect, useState } from "react";
import { useOnboardingStepContext } from "./OnboardingStepContextProvider";
import {
  RegisterConfirmation,
  RegisterConfirmationButtons,
} from "./RegisterConfirmation";
import { StepButtonProps } from "./Steps";

export const Register = () => {
  const { toast } = useToast();
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [isLoadingWallets, setIsLoadingWallets] = useState(true);
  const [walletsError, setWalletsError] = useState<string | undefined>();
  const { wallet, stepNumber } = useOnboardingStepContext();
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
          title: `Failed to load wallets: ${error}`,
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
        title: `Failed to load wallet customization: ${error}`,
        variant: "error",
      });
    }
  }, [walletsError, exchangeRatesError, toast]);

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
      <div className="flex flex-col justify-center gap-8 w-full py-4">
        <InfoRow
          icon="/icons/devices.svg"
          title="Test on your other devices"
          description="Use a passkey to log in on other devices for testing and debugging."
        />
        <InfoRow
          icon="/icons/secure.svg"
          title="Seamless, secure access"
          description="Passkeys let you access your test UMA faster and more securely using your face, fingerprint, or hardware key."
        />
      </div>
    </div>
  );
};

export const RegisterButtons = ({ onNext }: StepButtonProps) => {
  const { setError, overrideStep } = useOnboardingStepContext();
  const [isLoadingRegister, setIsLoadingRegister] = useState(false);

  const handleRegister = async () => {
    setIsLoadingRegister(true);
    try {
      const optionsRes = await fetch(
        `${getBackendUrl()}/auth/webauthn_options`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const options = await optionsRes.json();
      const attResp = await startRegistration({ optionsJSON: options });
      const verificationRes = await fetch(
        `${getBackendUrl()}/auth/webauthn_register`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(attResp),
        },
      );
      const verification = await verificationRes.json();
      if (verification.success) {
        overrideStep({
          content: RegisterConfirmation,
          buttons: RegisterConfirmationButtons,
        });
      } else {
        throw new Error("Failed to register passkey.");
      }
    } catch (e) {
      const error = e as unknown as Error;
      console.error(error);
      setError(error);
    } finally {
      setIsLoadingRegister(false);
    }
  };

  return (
    <div className="flex flex-col gap-[10px]">
      <SandboxButton
        buttonProps={{
          variant: "secondary",
          size: "lg",
          onClick: onNext,
        }}
        className="w-full"
      >
        Maybe later
      </SandboxButton>
      <SandboxButton
        buttonProps={{
          size: "lg",
          onClick: handleRegister,
        }}
        loading={isLoadingRegister}
        className="w-full"
      >
        Create passkey
      </SandboxButton>
    </div>
  );
};
