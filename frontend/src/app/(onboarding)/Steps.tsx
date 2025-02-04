"use client";

import { SandboxButton } from "@/components/SandboxButton";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useOnboardingStepContext } from "./OnboardingStepContextProvider";

export interface StepButtonProps {
  onNext: () => void;
}

export interface StepProps {
  title?: string;
  description?: string;
  content?: () => JSX.Element;
  buttons?: ({ onNext }: StepButtonProps) => JSX.Element;
  isBackable?: boolean;
  isSkippable?: boolean;
}

export const Steps = ({ showHeader }: { showHeader?: boolean }) => {
  const { stepProps } = useOnboardingStepContext();

  return <Step showHeader={showHeader} stepProps={stepProps} />;
};

export const Step = ({
  stepProps,
  showHeader,
}: {
  stepProps: StepProps;
  showHeader?: boolean;
}) => {
  const { onNext, onBack } = useOnboardingStepContext();

  return (
    <div className="flex flex-col align-center justify-center h-full w-full">
      {showHeader && (
        <div className="flex flex-row w-full justify-between items-center px-4 h-[44px]">
          {stepProps.isBackable ? (
            <SandboxButton
              buttonProps={{
                variant: "icon",
                size: "icon",
                onClick: onBack,
              }}
            >
              <Image
                src="/icons/chevron-left.svg"
                width={24}
                height={24}
                alt="Back"
                className="max-w-6"
              />
            </SandboxButton>
          ) : (
            <div className="w-6" />
          )}
          {stepProps.isSkippable ? (
            <Button
              variant="link"
              size="sm"
              className="text-secondary"
              onClick={onNext}
            >
              Skip
            </Button>
          ) : (
            <div className="w-6" />
          )}
        </div>
      )}
      <div className="flex flex-col h-full gap-8 pt-6 min-w-[300px] max-w-[425px]">
        {(stepProps.title || stepProps.description) && (
          <div className="flex flex-col gap-2 px-8">
            {stepProps.title && (
              <h1 className="text-primary text-[26px] font-normal leading-[34px] tracking-[-0.325px]">
                {stepProps.title}
              </h1>
            )}
            {stepProps.description && (
              <p className="text-secondary text-[15px] font-normal leading-[20px] tracking-[-0.187px]">
                {stepProps.description}
              </p>
            )}
          </div>
        )}
        {stepProps.content && (
          <div className="grow">{<stepProps.content />}</div>
        )}
        {stepProps.buttons && (
          <div className="w-full px-6 pb-4">
            {<stepProps.buttons onNext={onNext} />}
          </div>
        )}
      </div>
    </div>
  );
};
