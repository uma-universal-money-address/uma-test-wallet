"use client";
import OnboardingStepContextProvider, {
  OnboardingStep,
  useOnboardingStepContext,
} from "./(onboarding)/OnboardingStepContextProvider";
import { Step } from "./(onboarding)/Step";

export default function Home() {
  return (
    <div className="flex flex-col h-full">
      <OnboardingStepContextProvider
        stepOrder={[
          OnboardingStep.Welcome,
          OnboardingStep.CreateUma,
          OnboardingStep.CreatingTestUmaLoading,
          OnboardingStep.WalletCustomization,
          OnboardingStep.Finished,
        ]}
      >
        <Steps />
      </OnboardingStepContextProvider>
    </div>
  );
}

const Steps = () => {
  const { stepProps } = useOnboardingStepContext();

  return <Step {...stepProps} />;
};
