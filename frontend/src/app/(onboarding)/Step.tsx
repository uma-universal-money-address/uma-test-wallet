"use client";

import { useOnboardingStepContext } from "./OnboardingStepContextProvider";

export interface StepButtonProps {
  onNext: () => void;
}

export interface StepProps {
  title?: string;
  description?: string;
  content?: () => JSX.Element;
  buttons?: ({ onNext }: StepButtonProps) => JSX.Element;
}

export const Step = (props: StepProps) => {
  const { onNext } = useOnboardingStepContext();

  return (
    <div className="flex flex-col h-full gap-8 pt-6">
      {(props.title || props.description) && (
        <div className="flex flex-col gap-2 px-8 pb-3">
          {props.title && (
            <h1 className="text-primary text-[26px] font-normal leading-[34px] tracking-[-0.325px]">
              {props.title}
            </h1>
          )}
          {props.description && (
            <p className="text-secondary text-[15px] font-normal leading-[20px] tracking-[-0.187px]">
              {props.description}
            </p>
          )}
        </div>
      )}
      {props.content && <div className="grow">{<props.content />}</div>}
      {props.buttons && (
        <div className="w-full px-6 pb-4">
          {<props.buttons onNext={onNext} />}
        </div>
      )}
    </div>
  );
};
