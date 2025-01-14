"use client";

import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { SandboxButton } from "@/components/SandboxButton";
import { useToast } from "@/hooks/use-toast";
import { useLoginMethods, WebAuthnCredential } from "@/hooks/useLoginMethods";
import { revokePasskey } from "@/lib/revokePasskey";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const PasskeyRow = ({
  webAuthnCredential,
  onDelete,
}: {
  webAuthnCredential: WebAuthnCredential;
  onDelete: () => void;
}) => {
  const { toast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmRevoke, setShowConfirmRevoke] = useState(false);

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleRevokePasskey = async () => {
    try {
      await revokePasskey(webAuthnCredential.id);
      setShowEditModal(false);
      setShowConfirmRevoke(false);
      toast({
        title: "Passkey revoked",
      });
      onDelete();
    } catch (e) {
      const error = e as unknown as Error;
      toast({
        title: `Failed to revoke passkey: ${error.message}`,
        variant: "error",
      });
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setShowConfirmRevoke(false);
  };

  const handleEditModalOpenChange = (open: boolean) => {
    if (!open) {
      handleCloseEditModal();
    } else {
      setShowEditModal(true);
    }
  };

  return (
    <>
      <ResponsiveDialog
        title={showConfirmRevoke ? "Revoke access?" : "Edit passkey"}
        description={showConfirmRevoke ? "This action cannot be undone." : ""}
        open={showEditModal}
        onOpenChange={handleEditModalOpenChange}
      >
        <div className="flex flex-col gap-3 min-w-[345px]">
          <div className="flex flex-col">
            {showConfirmRevoke ? (
              <>
                <div className="flex flex-col px-6 pt-4 pb-8 gap-2">
                  <span className="text-[26px] font-normal leading-[34px] tracking-[-0.325px]">
                    Revoke access?
                  </span>
                  <span className="text-secondary text-[15px] font-normal leading-[20px] tracking-[-0.187px]">
                    This action cannot be undone.
                  </span>
                </div>
                <div className="flex flex-col px-6 pb-[28px] gap-3">
                  <SandboxButton
                    buttonProps={{
                      variant: "delete",
                      onClick: handleRevokePasskey,
                    }}
                    className="w-full"
                  >
                    Revoke
                  </SandboxButton>
                  <SandboxButton
                    buttonProps={{
                      variant: "outline",
                      onClick: handleCloseEditModal,
                    }}
                  >
                    Cancel
                  </SandboxButton>
                </div>
              </>
            ) : (
              <div className="flex flex-col px-6 py-[28px]">
                <SandboxButton
                  buttonProps={{
                    variant: "delete",
                    size: "sm",
                    onClick: () => setShowConfirmRevoke(true),
                  }}
                  className="w-full justify-start"
                >
                  <Image
                    src="/icons/trash.svg"
                    alt="Revoke"
                    width={24}
                    height={24}
                  />
                  Revoke
                </SandboxButton>
              </div>
            )}
          </div>
        </div>
      </ResponsiveDialog>
      <div className="flex flex-row justify-between py-5 px-6 border-[0.33px] rounded-3xl border-[#C0C9D6]">
        <div className="flex flex-row items-center">
          <Image
            src="/icons/passkeys.svg"
            alt="Passkey"
            width={24}
            height={24}
          />
          <div className="flex flex-col ml-4 overflow-hidden">
            <p className="text-primary text-[16px] font-semibold leading-[21px] tracking-[-0.2px]">
              Passkey
            </p>
            {webAuthnCredential.id && (
              <p className="text-secondary text-[13px] font-normal leading-[18px] tracking-[-0.162px] truncate">
                {webAuthnCredential.id}
              </p>
            )}
          </div>
        </div>
        <SandboxButton
          buttonProps={{
            variant: "icon",
            size: "icon",
            onClick: handleEdit,
          }}
        >
          <Image
            src="/icons/dot-grid-1x3-horizontal.svg"
            alt="Edit"
            width={18}
            height={18}
            className="opacity-50 min-w-[18px] min-h-[18px]"
          />
        </SandboxButton>
      </div>
    </>
  );
};

export default function Page() {
  const { toast } = useToast();
  const router = useRouter();

  const {
    loginMethods,
    error,
    refresh: refreshLoginMethods,
  } = useLoginMethods();

  if (error) {
    toast({
      title: "Failed to load passkeys",
      variant: "error",
    });
  }

  return (
    <div className="flex flex-col justify-between h-full w-full overflow-y-scroll no-scrollbar">
      <div className="flex flex-col">
        <div className="flex flex-col gap-2 py-6 px-8">
          <h1 className="text-primary text-[26px] font-normal leading-[34px] tracking-[-0.325px]">
            Passkeys
          </h1>
          <p className="text-secondary text-[15px] font-normal leading-[20px] tracking-[-0.187px]">
            Manage and create new passkeys for accessing your account
          </p>
        </div>
        <div className="flex flex-col px-6 gap-4">
          {loginMethods?.webAuthnCredentials.map((webAuthnCredential) => (
            <PasskeyRow
              key={webAuthnCredential.id}
              webAuthnCredential={webAuthnCredential}
              onDelete={refreshLoginMethods}
            />
          ))}
        </div>
      </div>
      <div className="p-6">
        <SandboxButton
          buttonProps={{
            size: "lg",
            onClick: () => router.push("/settings/passkeys/create"),
          }}
          className="flex flex-row w-full gap-2"
        >
          <Image
            className="invert"
            src="/icons/plus.svg"
            alt="Add"
            width={24}
            height={24}
          />
          Create passkey
        </SandboxButton>
      </div>
    </div>
  );
}
