"use client";

import { usePwaInstallStatus } from "@/hooks/usePwaInstallStatus";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Image from "next/image";
import { useEffect, useState } from "react";
import { TestWalletButton } from "./TestWalletButton";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";

export const BANNER_HEIGHT = 44;

interface Props {
  dismissable?: boolean;
  top?: boolean;
}

export const PwaInstallBanner = ({ dismissable, top }: Props) => {
  const { isInstalled, deviceType } = usePwaInstallStatus();
  const [isInstallScreenOpen, setIsInstallScreenOpen] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  useEffect(() => {
    if (dismissable && localStorage.getItem("pwa-install-banner-dismissed")) {
      setIsBannerVisible(false);
    }
  }, [dismissable]);

  const handleDismissBanner = () => {
    if (dismissable) {
      localStorage.setItem("pwa-install-banner-dismissed", "true");
      setIsBannerVisible(false);
    }
  };

  if (dismissable && !isBannerVisible) {
    return null;
  }

  const shouldShowBanner =
    !isInstalled && ["ios", "android"].includes(deviceType);

  return (
    <>
      <div
        style={{
          position: "relative",
          top: top ? "0" : "auto",
        }}
        className={`w-full max-h-[69px] p-4 mobile:px-0 mobile:pt-0 bg-white border-b border-gray-200 flex flex-row items-center justify-between gap-3 mb-[10px] ${
          shouldShowBanner ? "" : "hidden"
        }`}
      >
        <div className="flex flex-row items-center gap-2">
          {dismissable && (
            <Button
              variant="ghost"
              className="p-0 h-6"
              onClick={handleDismissBanner}
            >
              <Image
                src="/icons/close-small.svg"
                alt="close"
                width={24}
                height={24}
                className="opacity-50"
              />
            </Button>
          )}
          <div className="flex flex-row gap-3">
            <Image
              src="/uma-test-wallet-app.svg"
              alt="UMA test-wallet"
              width={36}
              height={36}
            />
            <div className="flex flex-col items-start justify-center">
              <div className="text-gray-800 text-sm font-semibold">{`It's better on the app`}</div>
              <div className="text-gray-500 text-xs">
                Get easy access and notifications
              </div>
            </div>
          </div>
        </div>
        <Button
          style={{ background: deviceType === "ios" ? "#0068C9" : "#19981E" }}
          className="text-white px-4 py-2"
          variant="installPrompt"
          size="tiny"
          onClick={() => setIsInstallScreenOpen(true)}
        >
          USE APP
        </Button>
      </div>
      {deviceType === "ios" && (
        <PwaInstallScreenIos
          onOpenChange={setIsInstallScreenOpen}
          isOpen={isInstallScreenOpen}
        />
      )}
      {deviceType === "android" && (
        <PwaInstallScreenAndroid
          onOpenChange={setIsInstallScreenOpen}
          isOpen={isInstallScreenOpen}
        />
      )}
    </>
  );
};

const TutorialStep = ({
  number,
  children,
}: {
  number: number;
  children: any;
}) => {
  return (
    <div className="flex flex-row items-center gap-4">
      <div className="flex items-center justify-center w-[36px] h-[36px] rounded-full bg-[#EBEEF2] text-primary">
        {number}
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[15px] font-normal leading-[20px] tracking-[-0.187px] inline">
          {children}
        </span>
      </div>
    </div>
  );
};

const IosTutorialImageRow = ({ width }: { width: number }) => {
  return (
    <div className="flex flex-row items-center justify-between w-full gap-2 h-[36px] bg-white pl-[11px] pr-[7px]">
      <div
        style={{ width: `${width}px` }}
        className="h-[12px] rounded-full bg-[#EBEEF2] py-[6px]"
      ></div>

      <div className="w-8 h-8 flex items-center justify-center">
        <div className="w-[18px] h-[18px] rounded-full bg-[#EBEEF2] p-[3px]"></div>
      </div>
    </div>
  );
};

const PwaInstallScreenIos = ({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <VisuallyHidden>
        <DialogTitle>Install the app</DialogTitle>
        <DialogDescription>Get easy access and notifications</DialogDescription>
      </VisuallyHidden>
      <DialogContent className="max-w-[432px] min-w-[300px] h-full max-h-[916px]">
        <div className="w-full h-full flex flex-col bg-white">
          <div className="flex flex-col h-full items-center justify-center">
            <div className="flex flex-col items-center justify-center h-1/2 w-full gap-[18px] bg-[#EBEEF2]">
              <div className="flex flex-col items-center justify-end gap-[18px] h-full pb-[36px] relative">
                <div className="w-[285px] h-[324px] flex flex-col items-center justify-end bg-[#EBEEF2] rounded-lg shadow-2xl p-3">
                  <div className="rounded-lg bg-white flex flex-col items-center justify-end w-full h-full divide-solid divide-y overflow-hidden">
                    <IosTutorialImageRow width={90} />
                    <IosTutorialImageRow width={128} />
                    <IosTutorialImageRow width={90} />
                    <IosTutorialImageRow width={56} />
                    <div className="flex flex-row items-center justify-between w-full gap-2 pl-[11px] pr-[7px] h-[36px]">
                      <span className="text-[12px] font-normal leading-[16px]">
                        Add to Home screen
                      </span>
                      <div className="w-8 h-8 flex items-center justify-center">
                        <Image
                          src="/icons/add_to_homescreen_ios.svg"
                          alt="add to homescreen"
                          width={16}
                          height={16}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-full bg-white flex p-2 flex-col justify-center items-center w-[44px] h-[44px]">
                  <Image
                    src="/icons/share.svg"
                    alt="share"
                    width={16}
                    height={16}
                  />
                </div>
              </div>
              <div
                style={{
                  background:
                    "linear-gradient(0deg, rgb(0 0 0 / 0%) 0.14%, rgb(235, 238, 242) 90.04%)",
                }}
                className="absolute w-full h-1/2 top-0"
              ></div>
            </div>
            <div className="flex flex-col items-center justify-center h-1/2">
              <div className="flex flex-col grow py-6 px-8 gap-8">
                <div className="flex flex-col gap-2">
                  <h1 className="text-[22px] font-normal leading-[28px] tracking-[-0.275px]">
                    Install the app
                  </h1>
                  <p className="text-[15px] font-normal leading[20px] tracking-[-0.187px] text-secondary">
                    Add UMA Test Wallet to your home screen to get a better
                    experience and payment notifications.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <TutorialStep number={1}>
                    Tap the Share
                    <Image
                      src="/icons/share.svg"
                      alt="share"
                      width={16}
                      height={16}
                      className="inline-block mx-[6px]"
                    />
                    icon in your browser
                  </TutorialStep>
                  <TutorialStep number={2}>
                    {`Tap "Add to Home Screen"`}
                  </TutorialStep>
                  <TutorialStep number={3}>
                    Open the UMA Test Wallet app
                  </TutorialStep>
                </div>
              </div>
              <div className="p-6 w-full">
                <TestWalletButton
                  className="w-full"
                  buttonProps={{
                    size: "lg",
                    onClick: () => onOpenChange(false),
                  }}
                >
                  Got it
                </TestWalletButton>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AndroidTutorialImageRow = ({ width }: { width: number }) => {
  return (
    <div className="flex flex-row items-center justify-start w-full gap-2 h-6">
      <div className="w-[18px] h-[18px] rounded-full bg-[#EBEEF2] p-[3px]"></div>
      <div
        style={{ width: `${width}px` }}
        className="h-[12px] rounded-full bg-[#EBEEF2] py-[6px]"
      ></div>
    </div>
  );
};

const PwaInstallScreenAndroid = ({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <VisuallyHidden>
        <DialogTitle>Install the app</DialogTitle>
        <DialogDescription>Get easy access and notifications</DialogDescription>
      </VisuallyHidden>
      <DialogContent className="max-w-[432px] min-w-[300px] h-full max-h-[916px]">
        <div className="w-full h-full flex flex-col bg-white">
          <div className="flex flex-col h-full items-center justify-center">
            <div className="flex flex-col items-center justify-center h-1/2 w-full gap-[18px] bg-[#EBEEF2] relative">
              <div className="flex flex-col items-center justify-start gap-[18px] h-full pt-[36px]">
                <div className="rounded-full bg-white flex p-2 flex-col justify-center items-center w-[44px] h-[44px] min-w-[44px] min-h-[44px] rotate-90">
                  <Image
                    src="/icons/dot-grid-1x3-horizontal.svg"
                    alt="settings"
                    width={20}
                    height={20}
                  />
                </div>
                <div className="w-[285px] h-[400px] flex flex-col items-center justify-start bg-white rounded-lg shadow-2xl gap-4 p-4 overflow-none">
                  <AndroidTutorialImageRow width={90} />
                  <AndroidTutorialImageRow width={128} />
                  <div className="flex flex-row items-center justify-start w-full gap-2 h-6">
                    <Image
                      src="/icons/mobile_friendly_24px.svg"
                      alt="add to phone"
                      width={24}
                      height={24}
                    />
                    <span className="text-[16px] font-normal leading-[24px] ">
                      Add to Home screen
                    </span>
                  </div>
                  <AndroidTutorialImageRow width={90} />
                  <AndroidTutorialImageRow width={56} />
                  <AndroidTutorialImageRow width={111} />
                  <AndroidTutorialImageRow width={90} />
                  <AndroidTutorialImageRow width={128} />
                  <AndroidTutorialImageRow width={90} />
                  <AndroidTutorialImageRow width={56} />
                  <AndroidTutorialImageRow width={111} />
                </div>
              </div>
              <div
                style={{
                  background:
                    "linear-gradient(rgba(0, 0, 0, 0) 0.14%, rgb(235 238 242 / 87%) 80.04%)",
                }}
                className="absolute w-full h-1/2 bottom-0"
              ></div>
            </div>
            <div className="flex flex-col items-center justify-center h-1/2 z-1 bg-white relative">
              <div className="flex flex-col grow py-6 px-8 gap-8">
                <div className="flex flex-col gap-2">
                  <h1 className="text-[22px] font-normal leading-[28px] tracking-[-0.275px]">
                    Install the app
                  </h1>
                  <p className="text-[15px] font-normal leading[20px] tracking-[-0.187px] text-secondary">
                    Add UMA Test Wallet to your home screen to get a better
                    experience and payment notifications.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <TutorialStep number={1}>
                    Tap the overflow menu
                    <Image
                      src="/icons/dot-grid-1x3-horizontal.svg"
                      alt="share"
                      width={18}
                      height={16}
                      className="rotate-90 inline-block"
                    />
                    icon in your browser
                  </TutorialStep>
                  <TutorialStep number={2}>
                    {`Tap "Add to Home screen"`}
                  </TutorialStep>
                  <TutorialStep number={3}>
                    Open the UMA Test Wallet app
                  </TutorialStep>
                </div>
              </div>
              <div className="p-6 w-full">
                <TestWalletButton
                  className="w-full"
                  buttonProps={{
                    size: "lg",
                    onClick: () => onOpenChange(false),
                  }}
                >
                  Got it
                </TestWalletButton>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
