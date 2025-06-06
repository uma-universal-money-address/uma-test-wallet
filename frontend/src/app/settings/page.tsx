"use client";

import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { SettingProps, SettingRow } from "@/components/SettingRow";
import { TestWalletButton } from "@/components/TestWalletButton";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/hooks/useAppState";
import { getBackendUrl } from "@/lib/backendUrl";
import { subscribeToPush, unsubscribeUser } from "@/lib/notificationActions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  const { toast } = useToast();
  const router = useRouter();
  const { resetAppState, setNotificationsStepCompleted } = useAppState();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  const handleToggleNotifications = async (value: boolean) => {
    if (typeof Notification === "undefined") {
      toast({
        description: "Notifications are not supported on this browser",
        variant: "error",
      });
      return;
    }

    if (value) {
      const requestRes = await Notification.requestPermission();
      if (requestRes === "granted") {
        try {
          await subscribeToPush();
          setNotificationsStepCompleted(true);
          setNotificationsEnabled(true);
        } catch (e) {
          toast({
            description: `Failed to subscribe to push notifications: ${e}`,
            variant: "error",
          });
        }
      } else {
        toast({
          description:
            "You must allow browser notifications to enable this feature",
          variant: "error",
        });
      }
    } else {
      try {
        await unsubscribeUser();
        setNotificationsEnabled(false);
      } catch (e) {
        toast({
          description: `Failed to unsubscribe from push notifications: ${e}`,
          variant: "error",
        });
      }
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${getBackendUrl()}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      resetAppState();
      router.push("/");
    } catch (e) {
      toast({
        description: `Failed to log out: ${e}`,
        variant: "error",
      });
    }
  };

  const settingRows: SettingProps[] = [
    {
      icon: "/icons/passkeys.svg",
      title: "Passkeys",
      action: { type: "link", href: "/settings/passkeys" },
      description: "Manage your passkeys for logging in",
    },
    {
      icon: "/icons/bell.svg",
      title: "Notifications",
      action: {
        type: "toggle",
        enabled: notificationsEnabled,
        onToggle: (value: boolean) => handleToggleNotifications(value),
      },
      description: "Get push notifications for when you receive payments",
    },
    {
      icon: "/icons/code.svg",
      title: "Documentation",
      action: { type: "external-link", href: "https://docs.uma.me" },
      description:
        "View developer docs in a variety of SDKs to help you integrate UMA into your app",
    },
    {
      icon: "/icons/github.svg",
      title: "GitHub",
      action: {
        type: "external-link",
        href: "https://github.com/uma-universal-money-address/uma-test-wallet",
      },
      description: "View the open-source GitHub repository for UMA Test Wallet",
    },
  ];

  return (
    <div className="flex flex-col justify-between h-full w-full overflow-y-scroll no-scrollbar">
      <div className="flex flex-col">
        <h1 className="text-primary text-[26px] font-normal leading-[34px] tracking-[-0.325px] pt-6 pb-3 px-8">
          Account Settings
        </h1>
        <div className="flex flex-col divide-y">
          {settingRows.map((settingProps) => (
            <SettingRow key={settingProps.title} {...settingProps} />
          ))}
        </div>
      </div>
      <div className="p-6">
        <ResponsiveDialog
          title="Are you sure?"
          description="Are you sure you want to log out?"
          open={isLogoutOpen}
          onOpenChange={(open: boolean) => setIsLogoutOpen(open)}
        >
          <div className="flex flex-col px-6 pt-4 pb-4 gap-[10px]">
            <span className="text-[26px] font-normal leading-[34px] tracking-[-0.325px] pb-6 px-2">
              Are you sure?
            </span>
            <TestWalletButton
              buttonProps={{
                variant: "destructive",
                onClick: handleLogout,
              }}
              className="w-full"
            >
              Log out
            </TestWalletButton>
            <TestWalletButton
              buttonProps={{
                variant: "secondary",
                size: "lg",
                onClick: () => setIsLogoutOpen(false),
              }}
              className="w-full"
            >
              Cancel
            </TestWalletButton>
          </div>
        </ResponsiveDialog>
        <TestWalletButton
          buttonProps={{
            variant: "destructiveOutline",
            onClick: () => setIsLogoutOpen(true),
          }}
          className="w-full"
        >
          Log out
        </TestWalletButton>
      </div>
    </div>
  );
}
