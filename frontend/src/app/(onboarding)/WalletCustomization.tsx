"use client";

import { SandboxButton } from "@/components/SandboxButton";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Wallet } from "@/components/Wallet";
import { useToast } from "@/hooks/use-toast";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { useLoginMethods } from "@/hooks/useLoginMethods";
import { fetchWallets, Wallet as WalletType } from "@/hooks/useWalletContext";
import { getBackendUrl } from "@/lib/backendUrl";
import { getUmaFromUsername } from "@/lib/uma";
import { updateWallet } from "@/lib/updateWallet";
import { WalletColor } from "@/lib/walletColorMapping";
import { startRegistration } from "@simplewebauthn/browser";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useOnboardingStepContext } from "./OnboardingStepContextProvider";
import { StepButtonProps } from "./Step";

export const WalletCustomization = () => {
  const { toast } = useToast();
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [isLoadingWallets, setIsLoadingWallets] = useState(true);
  const [walletsError, setWalletsError] = useState<string | undefined>();
  const { uma, wallet, walletColor, setWalletColor } =
    useOnboardingStepContext();
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
    <div className="flex flex-col h-full w-full items-center px-6 pb-3">
      <div className="w-full pt-4 pb-5">
        <Wallet
          uma={getUmaFromUsername(uma)}
          wallet={wallet}
          walletIndex={wallets.length}
          exchangeRates={exchangeRates}
          isLoading={isLoadingExchangeRates || isLoadingWallets}
          options={{
            showUma: true,
          }}
        />
      </div>
      <div className="flex flex-row w-full max-w-[340px] justify-between px-2 pb-5">
        {Object.values(WalletColor).map((color) => {
          return (
            <button
              key={color}
              className={`w-6 h-6 rounded-full cursor-pointer ${
                walletColor === color
                  ? "outline-offset-[-6px] outline-2 outline outline-white"
                  : ""
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setWalletColor(color)}
            />
          );
        })}
      </div>
    </div>
  );
};

export const WalletCustomizationButtons = ({ onNext }: StepButtonProps) => {
  const { wallet, walletColor, setError } = useOnboardingStepContext();
  const {
    loginMethods,
    isLoading: isLoadingLoginMethods,
    error: errorLoadingLoginMethods,
  } = useLoginMethods();

  const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isLoadingRegister, setIsLoadingRegister] = useState(false);

  useEffect(() => {
    if (errorLoadingLoginMethods) {
      setError(new Error(errorLoadingLoginMethods));
    }
  }, [errorLoadingLoginMethods, setError]);

  const handleSubmit = async () => {
    setError(null);

    if (!wallet) {
      setError(new Error("Wallet is missing."));
      return;
    }

    setIsLoadingSubmit(true);
    try {
      const res = await updateWallet(wallet.id, { color: walletColor });
      if (!res) {
        setError(new Error("Failed to update wallet."));
      }

      // Skip registration if already has login methods
      if (loginMethods?.webAuthnCredentials?.length) {
        onNext();
      }

      setIsRegistrationOpen(true);
    } catch (e) {
      const error = e as unknown as Error;
      console.error(error);
      setError(error);
    } finally {
      setIsLoadingSubmit(false);
    }
  };

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
        onNext();
      } else {
        console.error("Failed to register with WebAuthn.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingRegister(false);
    }
  };

  return (
    <>
      {isRegistrationOpen && (
        <Drawer
          open={isRegistrationOpen}
          onClose={() => setIsRegistrationOpen(false)}
        >
          <DrawerContent>
            <DrawerHeader className="flex flex-row w-full justify-end">
              <DrawerClose asChild>
                <Button variant="icon" size="icon">
                  <Image
                    src="/icons/close.svg"
                    alt="Close"
                    width={24}
                    height={24}
                  />
                </Button>
              </DrawerClose>
            </DrawerHeader>
            <DrawerTitle>
              <div className="flex flex-col gap-2 px-8 pb-8">
                <div className="flex flex-row gap-1">
                  <Image
                    src="/icons/passkeys.svg"
                    alt="Passkeys"
                    width={32}
                    height={32}
                  />
                  <span className="text-[26px] font-normal leading-[34px] tracking-[-0.325px]">
                    Create a passkey
                  </span>
                </div>
              </div>
            </DrawerTitle>
            <div className="flex flex-col px-6 pb-12 gap-[10px]">
              <SandboxButton
                buttonProps={{
                  variant: "secondary",
                  size: "lg",
                  onClick: onNext,
                }}
                className="w-full"
              >
                Skip for now
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
          </DrawerContent>
        </Drawer>
      )}
      <div className="flex flex-col gap-[10px]">
        <SandboxButton
          buttonProps={{
            size: "lg",
            onClick: handleSubmit,
          }}
          disabled={isLoadingLoginMethods}
          loading={isLoadingSubmit}
          className="w-full"
        >
          Continue
        </SandboxButton>
      </div>
    </>
  );
};
