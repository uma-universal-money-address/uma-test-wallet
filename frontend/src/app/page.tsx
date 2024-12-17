"use client";
import OnboardingStepContextProvider, {
  OnboardingStep,
  useOnboardingStepContext,
} from "./(onboarding)/OnboardingStepContextProvider";
import { Step } from "./(onboarding)/Step";

export default function Home() {
  // const router = useRouter();
  // const [isLoadingRegister, setIsLoadingRegister] = useState(false);

  // const handleRegister = async () => {
  //   setIsLoadingRegister(true);
  //   try {
  //     const optionsRes = await fetch(
  //       `${getBackendUrl()}/auth/webauthn_options`,
  //       {
  //         method: "POST",
  //         credentials: "include",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //       },
  //     );
  //     const options = await optionsRes.json();
  //     const attResp = await startRegistration({ optionsJSON: options });
  //     const verificationRes = await fetch(
  //       `${getBackendUrl()}/auth/webauthn_register`,
  //       {
  //         method: "POST",
  //         credentials: "include",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify(attResp),
  //       },
  //     );
  //     const verification = await verificationRes.json();
  //     if (verification.success) {
  //       router.push(`/wallet`);
  //     } else {
  //       console.error("Failed to register with WebAuthn.");
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   } finally {
  //     setIsLoadingRegister(false);
  //   }
  // };

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
      {/* <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-inter)]">
        <SandboxButton
          loading={isLoadingRegister}
          buttonProps={{
            className: "w-full",
            onClick: handleRegister,
          }}
        >
          <span>Register</span>
        </SandboxButton>
      </div> */}
      <Steps />
    </OnboardingStepContextProvider>
  );
}

const Steps = () => {
  const { stepProps } = useOnboardingStepContext();

  return <Step {...stepProps} />;
};
