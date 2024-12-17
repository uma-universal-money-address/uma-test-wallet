"use client";

import { SandboxButton } from "@/components/SandboxButton";
import { UmaInput } from "@/components/UmaInput";
import { getBackendDomain } from "@/lib/backendDomain";
import { checkUmaAvailability, createUma } from "@/lib/uma";
import { useEffect, useRef, useState } from "react";
import { useOnboardingStepContext } from "./OnboardingStepContextProvider";
import { StepButtonProps } from "./Step";

export const CreateUma = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    uma,
    umaError,
    umaInputMessage,
    setUma,
    setUmaError,
    setUmaInputMessage,
    setWallet,
    onNext,
  } = useOnboardingStepContext();

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setUma(newValue);
    setUmaError(undefined);

    if (newValue.length === 0) {
      setUmaInputMessage(undefined);
      setUmaError(undefined);
      return;
    }

    try {
      const succeeded = await checkUmaAvailability(newValue);
      if (!succeeded) {
        setUmaError("UMA username is not available.");
      }
      setUmaInputMessage("UMA username is available.");
    } catch (error) {
      console.error(error);
      setUmaError("Failed to check UMA username availability.");
    }
  };

  const handleSubmit = async () => {
    setUmaError(undefined);
    try {
      const wallet = await createUma(uma);
      if (!wallet) {
        setUmaError("Failed to create UMA username.");
      }
      setWallet(wallet);
      onNext();
    } catch (error) {
      console.error(error);
      setUmaError("Failed to create UMA username.");
    }
  };

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  });

  return (
    <div className="flex flex-col h-full w-full items-center px-8 pb-3">
      <UmaInput
        message={umaInputMessage}
        error={umaError}
        innerRef={inputRef}
        inputProps={{
          placeholder: "you",
          onChange: handleChange,
          value: uma,
        }}
        onEnter={handleSubmit}
        before="$"
        after={`@${getBackendDomain()}`}
      />
    </div>
  );
};

export const CreateUmaButtons = ({ onNext }: StepButtonProps) => {
  const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
  const { uma, setWallet, setUmaError, setUmaInputMessage } =
    useOnboardingStepContext();

  const handlePickForMe = () => {
    // TODO: Implement
  };

  const handleSubmit = async () => {
    setUmaError(undefined);

    if (uma.length === 0) {
      setUmaInputMessage(undefined);
      setUmaError(undefined);
      return;
    }

    setIsLoadingSubmit(true);
    try {
      const succeeded = await checkUmaAvailability(uma);
      if (!succeeded) {
        setUmaError("UMA username is not available.");
        setIsLoadingSubmit(false);
        return;
      }
      setUmaInputMessage("UMA username is available.");
    } catch (error) {
      console.error(error);
      setUmaError("Failed to check UMA username availability.");
      setIsLoadingSubmit(false);
      return;
    }

    try {
      const wallet = await createUma(uma);
      if (!wallet) {
        setUmaError("Failed to create UMA username.");
      }
      setWallet(wallet);
      onNext();
    } catch (error) {
      console.error(error);
      setUmaError("Failed to create UMA username.");
    } finally {
      setIsLoadingSubmit(false);
    }
  };

  return (
    <div className="flex flex-col gap-[10px]">
      <SandboxButton
        buttonProps={{
          variant: "secondary",
          size: "lg",
          onClick: handlePickForMe,
        }}
        className="w-full"
      >
        Pick for me
      </SandboxButton>
      <SandboxButton
        buttonProps={{
          size: "lg",
          onClick: handleSubmit,
        }}
        loading={isLoadingSubmit}
        className="w-full"
      >
        Continue
      </SandboxButton>
    </div>
  );
};
