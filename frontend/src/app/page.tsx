"use client";
import OnboardingStepContextProvider, {
  OnboardingStep,
  useOnboardingStepContext,
} from "./(onboarding)/OnboardingStepContextProvider";
import { Step } from "./(onboarding)/Step";

export default function Home() {
  return (
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
  );
}

const Steps = () => {
  const { stepProps } = useOnboardingStepContext();

  return <Step {...stepProps} />;
};
