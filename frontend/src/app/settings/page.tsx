"use client";

import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { SandboxButton } from "@/components/SandboxButton";
import { useToast } from "@/hooks/use-toast";
import { getBackendUrl } from "@/lib/backendUrl";
import { subscribeToPush, unsubscribeUser } from "@/lib/notificationActions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SettingProps, SettingRow } from "./SettingRow";

export default function Page() {
  const { toast } = useToast();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  useEffect(() => {
    setNotificationsEnabled(Notification.permission === "granted");
  }, []);

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const requestRes = await Notification.requestPermission();
      if (requestRes === "granted") {
        try {
          await subscribeToPush();
          setNotificationsEnabled(true);
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
    } else {
      try {
        await unsubscribeUser();
        setNotificationsEnabled(false);
      } catch (e) {
        toast({
          title: `Failed to unsubscribe from push notifications: ${e}`,
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
      router.push("/");
    } catch (e) {
      toast({
        title: `Failed to log out: ${e}`,
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
        href: "https://github.com/uma-universal-money-address/uma-sandbox",
      },
      description: "View the open-source GitHub repository for UMA Sandbox",
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
            <SandboxButton
              buttonProps={{
                variant: "destructive",
                onClick: handleLogout,
              }}
              className="w-full"
            >
              Log out
            </SandboxButton>
            <SandboxButton
              buttonProps={{
                variant: "secondary",
                size: "lg",
                onClick: () => setIsLogoutOpen(false),
              }}
              className="w-full"
            >
              Cancel
            </SandboxButton>
          </div>
        </ResponsiveDialog>
        <SandboxButton
          buttonProps={{
            variant: "destructiveOutline",
            onClick: () => setIsLogoutOpen(true),
          }}
          className="w-full"
        >
          Log out
        </SandboxButton>
      </div>
    </div>
  );
}
