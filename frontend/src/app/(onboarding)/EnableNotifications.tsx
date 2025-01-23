"use client";

import { SandboxButton } from "@/components/SandboxButton";
import { useToast } from "@/hooks/use-toast";
import { subscribeToPush } from "@/lib/notificationActions";
import Image from "next/image";
import { StepButtonProps } from "./Steps";

interface MockNotificationProps {
  title: string;
  time: string;
  descriptionWidths: number[];
}

const MockNotification = ({
  title,
  time,
  descriptionWidths,
}: MockNotificationProps) => {
  return (
    <div className="flex flex-row w-full items-center justify-start gap-[9px] border-[0.3px] border-[#DEDFE4] rounded-[22px] bg-[#F9F9F9] p-[13px] pb-[11px]">
      <Image
        src="/uma-sandbox-app.svg"
        alt="UMA Sandbox logo"
        width={34}
        height={34}
      />
      <div className="flex flex-col w-full">
        <div className="flex flex-row w-full items-center justify-between gap-[14px]">
          <span className="text-[14px] font-medium leading-[18px] tracking-[-0.21px]">
            {title}
          </span>
          <span className="text-[12px] font-normal leading-[18px] font-[#3D3D3D] opacity-50 text-nowrap">
            {time}
          </span>
        </div>
        <div className="flex flex-col gap-[6px] pt-[6px] pb-[4.5px]">
          {descriptionWidths.map((width, index) => (
            <div
              key={index}
              className="rounded-full w-full bg-[#DEDFE4] h-[10px]"
              style={{ maxWidth: `${width}px` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const EnableNotifications = () => {
  return (
    <div className="relative flex flex-col h-fit w-full items-center px-8 pb-3 gap-[11px]">
      <MockNotification
        title="You received 100.00 USD"
        time="now"
        descriptionWidths={[222]}
      />
      <MockNotification
        title="You received 2,000.00 PHP"
        time="5 min ago"
        descriptionWidths={[235, 130]}
      />
      <MockNotification
        title="You received 500.00 GBP"
        time="2h ago"
        descriptionWidths={[255, 226]}
      />
      <MockNotification
        title="You received 1,500.00 MXN"
        time="9:41 AM"
        descriptionWidths={[239, 230]}
      />

      <div
        className="absolute bottom-0 left-0 h-full w-full"
        style={{
          background:
            "linear-gradient(rgba(255, 255, 255, 0) 0.14%, hsl(var(--background)))",
        }}
      ></div>
    </div>
  );
};

export const EnableNotificationsButtons = ({ onNext }: StepButtonProps) => {
  const { toast } = useToast();

  const handleEnableNotifications = async () => {
    const requestRes = await Notification.requestPermission();
    if (requestRes === "granted") {
      try {
        await subscribeToPush();
        onNext();
      } catch (e) {
        toast({
          title: `Failed to subscribe to push notifications: ${e}`,
          variant: "error",
        });
      }
    } else {
      toast({
        title: "You must allow browser notifications to enable this feature",
        variant: "error",
      });
    }
  };

  return (
    <div className="flex flex-col">
      <SandboxButton
        buttonProps={{
          size: "lg",
          onClick: handleEnableNotifications,
        }}
        className="w-full"
      >
        Turn on notifications
      </SandboxButton>
    </div>
  );
};
