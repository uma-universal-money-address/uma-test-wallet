"use client";

import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { SettingProps, SettingRow } from "@/components/SettingRow";
import { TestWalletButton } from "@/components/TestWalletButton";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/hooks/useAppState";
import {
  useWallets,
  REQUIRED_COUNTERPARTY_FIELD_OPTIONS,
  RequiredCounterpartyField,
} from "@/hooks/useWalletContext";
import { getBackendDomain } from "@/lib/backendDomain";
import { deleteWallet } from "@/lib/deleteWallet";
import isDevelopment from "@/lib/isDevelopment";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormSection } from "./FormSection";
import { CheckboxGroup } from "./CheckboxGroup";
import { FormInput } from "./FormInput";
import { RadioGroupWrapper } from "./RadioGroupWrapper";
import { updateWallet } from "@/lib/updateWallet";
import {
  validateCountryCode,
  validatePhoneNumber,
  validateEmail,
  validateDate,
  formatCountryCode,
  formatPhoneNumber,
} from "@/lib/validators";
import type {
  KycStatus,
  WalletUserType,
  BankAccountNameMatchingStatus,
} from "@/hooks/useWalletContext";

export default function Page() {
  const { toast } = useToast();
  const router = useRouter();
  const { currentWallet, setCurrentWallet } = useAppState();
  const [isDeleteUmaOpen, setIsDeleteUmaOpen] = useState(false);
  const { wallets, isLoading: isLoadingWallets, fetchWallets } = useWallets();

  const handleDeleteUma = async () => {
    if (currentWallet) {
      try {
        await deleteWallet(currentWallet.id);
        await fetchWallets();
        setCurrentWallet(
          wallets && wallets.length > 1
            ? wallets.filter((wallet) => wallet.id !== currentWallet.id)[0]
            : undefined,
        );
        router.push("/wallet");
      } catch (e) {
        toast({
          description: `Failed to delete uma: ${e}`,
          variant: "error",
        });
      }
    }
  };

  const handleRequiredCounterpartyFieldsChange = async (
    values: RequiredCounterpartyField[],
  ) => {
    if (!currentWallet) return;

    try {
      const updatedWallet = await updateWallet(currentWallet.id, {
        requiredCounterpartyFields: values,
      });
      setCurrentWallet(updatedWallet);
    } catch (e) {
      toast({
        description: `Failed to update required counterparty fields: ${e}`,
        variant: "error",
      });
    }
  };

  const handleFieldUpdate = async (
    fieldName: string,
    value: string | Record<string, string>,
  ) => {
    if (!currentWallet) return;

    try {
      const updatedWallet = await updateWallet(currentWallet.id, {
        [fieldName]: value,
      } as any);
      setCurrentWallet(updatedWallet);
    } catch (e) {
      toast({
        description: `Failed to update ${fieldName}: ${e}`,
        variant: "error",
      });
    }
  };

  const handleKycStatusChange = async (value: string) => {
    if (!currentWallet) return;
    try {
      const updatedWallet = await updateWallet(currentWallet.id, {
        kycStatus: value as KycStatus,
      });
      setCurrentWallet(updatedWallet);
    } catch (e) {
      toast({
        description: `Failed to update KYC status: ${e}`,
        variant: "error",
      });
    }
  };

  const handleUserTypeChange = async (value: string) => {
    if (!currentWallet) return;
    try {
      const updatedWallet = await updateWallet(currentWallet.id, {
        userType: value as WalletUserType,
      });
      setCurrentWallet(updatedWallet);
    } catch (e) {
      toast({
        description: `Failed to update user type: ${e}`,
        variant: "error",
      });
    }
  };

  const handleBankAccountMatchingStatusChange = async (value: string) => {
    if (!currentWallet) return;
    try {
      const updatedWallet = await updateWallet(currentWallet.id, {
        bankAccountNameMatchingStatus: value as BankAccountNameMatchingStatus,
      });
      setCurrentWallet(updatedWallet);
    } catch (e) {
      toast({
        description: `Failed to update bank account matching status: ${e}`,
        variant: "error",
      });
    }
  };

  const settingRows: SettingProps[] = [
    {
      icon: "/icons/square-grid-circle.svg",
      title: "Manage connected apps",
      action: {
        type: "external-link",
        href: `${
          isDevelopment ? "http" : "https"
        }://${getBackendDomain()}/nwc/`,
      },
      description: "View your UMA Auth connections",
    },
  ];

  return (
      <div className="flex flex-col pt-2 px-6 pb-4 gap-6">
        <FormSection title="Required Counterparty Fields">
          <CheckboxGroup
            options={REQUIRED_COUNTERPARTY_FIELD_OPTIONS}
            selectedValues={currentWallet?.requiredCounterpartyFields || []}
            onChange={handleRequiredCounterpartyFieldsChange}
            disabled={!currentWallet}
          />
        </FormSection>

        <FormSection title="User Information">
          <RadioGroupWrapper
            label="KYC Status"
            options={[
              { value: "VERIFIED", label: "Verified" },
              { value: "NOT_VERIFIED", label: "Not Verified" },
              { value: "PENDING", label: "Pending" },
              { value: "UNKNOWN", label: "Unknown" },
            ]}
            value={currentWallet?.kycStatus || "UNKNOWN"}
            onChange={handleKycStatusChange}
            disabled={!currentWallet}
          />

          <RadioGroupWrapper
            label="User Type"
            options={[
              { value: "INDIVIDUAL", label: "Individual" },
              { value: "BUSINESS", label: "Business" },
            ]}
            value={currentWallet?.userType || "INDIVIDUAL"}
            onChange={handleUserTypeChange}
            disabled={!currentWallet}
          />

          <FormInput
            label="Full Name"
            value={currentWallet?.fullName || ""}
            onChange={(value) => handleFieldUpdate("fullName", value)}
            placeholder="Enter full name"
            disabled={!currentWallet}
          />

          <FormInput
            label="Email Address"
            value={currentWallet?.emailAddress || ""}
            onChange={(value) => handleFieldUpdate("emailAddress", value)}
            placeholder="email@example.com"
            validator={validateEmail}
            disabled={!currentWallet}
          />

          <FormInput
            label="Birthday"
            value={currentWallet?.birthday || ""}
            onChange={(value) => handleFieldUpdate("birthday", value)}
            placeholder="YYYY-MM-DD"
            validator={validateDate}
            disabled={!currentWallet}
          />

          <FormInput
            label="Phone Number"
            value={currentWallet?.phoneNumber || ""}
            onChange={(value) => handleFieldUpdate("phoneNumber", value)}
            placeholder="+12025551234"
            validator={validatePhoneNumber}
            formatter={formatPhoneNumber}
            disabled={!currentWallet}
          />

          <FormInput
            label="Nationality"
            value={currentWallet?.nationality || ""}
            onChange={(value) => handleFieldUpdate("nationality", value)}
            placeholder="US"
            maxLength={2}
            validator={validateCountryCode}
            formatter={formatCountryCode}
            disabled={!currentWallet}
          />

          <FormInput
            label="Country of Residence"
            value={currentWallet?.countryOfResidence || ""}
            onChange={(value) => handleFieldUpdate("countryOfResidence", value)}
            placeholder="US"
            maxLength={2}
            validator={validateCountryCode}
            formatter={formatCountryCode}
            disabled={!currentWallet}
          />

          <FormInput
            label="Tax ID"
            value={currentWallet?.taxId || ""}
            onChange={(value) => handleFieldUpdate("taxId", value)}
            placeholder="Enter tax ID"
            disabled={!currentWallet}
          />

          <div className="flex flex-col gap-2">
            <span className="text-[14px] font-normal leading-[18px] tracking-[-0.175px] text-secondary">
              Address
            </span>
            <FormInput
              label="Address Line 1"
              value={currentWallet?.address?.line1 || ""}
              onChange={(value) =>
                handleFieldUpdate("address", {
                  ...currentWallet?.address,
                  line1: value,
                })
              }
              placeholder="Street address"
              disabled={!currentWallet}
            />
            <FormInput
              label="Address Line 2"
              value={currentWallet?.address?.line2 || ""}
              onChange={(value) =>
                handleFieldUpdate("address", {
                  ...currentWallet?.address,
                  line2: value,
                })
              }
              placeholder="Apt, suite, etc. (optional)"
              disabled={!currentWallet}
            />
            <FormInput
              label="City"
              value={currentWallet?.address?.city || ""}
              onChange={(value) =>
                handleFieldUpdate("address", {
                  ...currentWallet?.address,
                  city: value,
                })
              }
              placeholder="City"
              disabled={!currentWallet}
            />
            <FormInput
              label="State"
              value={currentWallet?.address?.state || ""}
              onChange={(value) =>
                handleFieldUpdate("address", {
                  ...currentWallet?.address,
                  state: value,
                })
              }
              placeholder="State"
              disabled={!currentWallet}
            />
            <FormInput
              label="Country"
              value={currentWallet?.address?.country || ""}
              onChange={(value) =>
                handleFieldUpdate("address", {
                  ...currentWallet?.address,
                  country: value,
                })
              }
              placeholder="US"
              maxLength={2}
              validator={validateCountryCode}
              formatter={formatCountryCode}
              disabled={!currentWallet}
            />
            <FormInput
              label="Postal Code"
              value={currentWallet?.address?.postalCode || ""}
              onChange={(value) =>
                handleFieldUpdate("address", {
                  ...currentWallet?.address,
                  postalCode: value,
                })
              }
              placeholder="Postal code"
              disabled={!currentWallet}
            />
          </div>
        </FormSection>

        <FormSection title="Account Information">
          <RadioGroupWrapper
            label="Bank Account Name Matching Status"
            options={[
              { value: "UNKNOWN", label: "Unknown" },
              { value: "MATCHED", label: "Matched" },
              { value: "NOT_MATCHED", label: "Not Matched" },
            ]}
            value={
              currentWallet?.bankAccountNameMatchingStatus || "UNKNOWN"
            }
            onChange={handleBankAccountMatchingStatusChange}
            disabled={!currentWallet}
          />

          <FormInput
            label="Account Name"
            value={currentWallet?.accountName || ""}
            onChange={(value) => handleFieldUpdate("accountName", value)}
            placeholder="Enter account name"
            disabled={!currentWallet}
          />

          <FormInput
            label="Account Identifier"
            value={currentWallet?.accountIdentifier || ""}
            onChange={(value) => handleFieldUpdate("accountIdentifier", value)}
            placeholder="Enter account identifier"
            disabled={!currentWallet}
          />
        </FormSection>

        <FormSection title="FI Information">
          <FormInput
            label="FI Legal Entity Name"
            value={currentWallet?.fiLegalEntityName || ""}
            onChange={(value) => handleFieldUpdate("fiLegalEntityName", value)}
            placeholder="Enter FI legal entity name"
            disabled={!currentWallet}
          />

          <FormInput
            label="Financial Institution LEI"
            value={currentWallet?.financialInstitutionLei || ""}
            onChange={(value) =>
              handleFieldUpdate("financialInstitutionLei", value)
            }
            placeholder="Enter LEI"
            disabled={!currentWallet}
          />

          <FormInput
            label="Ultimate Institution Country"
            value={currentWallet?.ultimateInstitutionCountry || ""}
            onChange={(value) =>
              handleFieldUpdate("ultimateInstitutionCountry", value)
            }
            placeholder="US"
            maxLength={2}
            validator={validateCountryCode}
            formatter={formatCountryCode}
            disabled={!currentWallet}
          />
        </FormSection>

        {settingRows.map((settingProps) => (
          <SettingRow key={settingProps.title} {...settingProps} />
        ))}
        <TestWalletButton
          buttonProps={{
            variant: "delete",
            onClick: () => setIsDeleteUmaOpen(true),
          }}
          className="w-full"
        >
          Delete test UMA
        </TestWalletButton>
        <ResponsiveDialog
          title="Are you sure?"
          description="Are you sure you want to log out?"
          open={isDeleteUmaOpen}
          onOpenChange={(open: boolean) => setIsDeleteUmaOpen(open)}
        >
          <div className="flex flex-col px-6 pt-4 pb-4 gap-[10px]">
            <div className="flex flex-col gap-2 pb-6 px-2">
              <span className="text-[26px] font-normal leading-[34px] tracking-[-0.325px]">
                Are you sure?
              </span>
              <span className="text-secondary text-[15px] font-normal leading-[20px] tracking-[-0.187px]">
                This will delete your test UMA along with its test funds and
                connections.
              </span>
            </div>
            <TestWalletButton
              buttonProps={{
                variant: "delete",
                onClick: handleDeleteUma,
              }}
              className="w-full"
            >
              Delete test UMA
            </TestWalletButton>
            <TestWalletButton
              buttonProps={{
                variant: "secondary",
                size: "lg",
                onClick: () => setIsDeleteUmaOpen(false),
              }}
              className="w-full"
            >
              Cancel
            </TestWalletButton>
          </div>
        </ResponsiveDialog>
    </div>
  );
}
