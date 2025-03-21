"use client";

import { TestWalletButton } from "@/components/TestWalletButton";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface BaseAction {
  type: string;
}

interface LinkAction extends BaseAction {
  type: "link";
  href: string;
}

interface ToggleAction extends BaseAction {
  type: "toggle";
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

interface ExternalLinkAction extends BaseAction {
  type: "external-link";
  href: string;
}

export type Action = LinkAction | ToggleAction | ExternalLinkAction;

export interface SettingProps {
  icon: string;
  title: string;
  action: Action;
  description?: string;
}

export const SettingRow = ({
  icon,
  title,
  description,
  action,
}: SettingProps) => {
  const router = useRouter();
  return (
    <div className="flex flex-row items-start justify-start pt-5 mr-4 ml-6 gap-4 pb-5">
      <Image src={icon} width={24} height={24} alt={title} />
      <div className="flex flex-row w-full items-start justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-primary text-[16px] font-semibold leading-[21px] tracking-[-0.2px]">
            {title}
          </span>
          {description && (
            <p className="text-secondary text-[12px] font-normal leading-[16px] tracking-[-0.15px]">
              {description}
            </p>
          )}
        </div>
        <div className="flex flex-row items-start gap-4">
          {action.type === "link" && (
            <TestWalletButton
              buttonProps={{
                variant: "icon",
                size: "icon",
                onClick: () => router.push(action.href),
              }}
            >
              <Image
                src="/icons/chevron-right.svg"
                width={18}
                height={18}
                alt="Navigate"
                className="max-w-6"
              />
            </TestWalletButton>
          )}
          {action.type === "toggle" && (
            <Switch
              checked={action.enabled}
              onCheckedChange={action.onToggle}
            />
          )}
          {action.type === "external-link" && (
            <TestWalletButton
              buttonProps={{
                variant: "icon",
                size: "icon",
                onClick: () => window.open(action.href, "_blank"),
              }}
            >
              <Image
                src="/icons/square-arrow-top-right-2.svg"
                width={18}
                height={18}
                className="max-w-6"
                alt="Open in new tab"
              />
            </TestWalletButton>
          )}
        </div>
      </div>
    </div>
  );
};
