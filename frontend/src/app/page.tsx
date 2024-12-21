"use client";
import { useRouter } from "next/navigation";
import OnboardingStepContextProvider, {
  OnboardingStep,
} from "./(onboarding)/OnboardingStepContextProvider";
import { Steps } from "./(onboarding)/Steps";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full items-center justify-center">
      <OnboardingStepContextProvider
        stepOrder={[
          OnboardingStep.Welcome,
          OnboardingStep.CreateUma,
          OnboardingStep.CreatingTestUmaLoading,
          OnboardingStep.WalletCustomization,
          OnboardingStep.Finished,
        ]}
        onFinish={() => router.push("/wallet")}
      >
        <Steps />
      </OnboardingStepContextProvider>
    </div>
  );
}
