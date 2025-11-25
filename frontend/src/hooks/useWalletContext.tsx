import { getBackendUrl } from "@/lib/backendUrl";
import {
  RAW_WALLET_COLOR_MAPPING,
  WalletColor,
} from "@/lib/walletColorMapping";
import { Currency } from "@/types/Currency";
import React, { useCallback, useEffect, useState } from "react";
import { useAppState } from "./useAppState";
import { useInterval } from "./useInterval";
import { RawUma, Uma } from "./useUmaContext";

export type RawWalletColor =
  | "ONE"
  | "TWO"
  | "THREE"
  | "FOUR"
  | "FIVE"
  | "SIX"
  | "SEVEN"
  | "EIGHT"
  | "NINE"
  | "TEN";

export const REQUIRED_COUNTERPARTY_FIELD_OPTIONS = [
  "FULL_NAME",
  "BIRTH_DATE",
  "NATIONALITY",
  "PHONE_NUMBER",
  "EMAIL",
  "POSTAL_ADDRESS",
  "TAX_ID",
  "REGISTRATION_NUMBER",
  "USER_TYPE",
  "COUNTRY_OF_RESIDENCE",
  "ACCOUNT_IDENTIFIER",
  "FI_LEGAL_ENTITY_NAME",
  "FI_ADDRESS",
  "PURPOSE_OF_PAYMENT",
  "ULTIMATE_INSTITUTION_COUNTRY",
  "IDENTIFIER",
] as const;

export type RequiredCounterpartyField =
  (typeof REQUIRED_COUNTERPARTY_FIELD_OPTIONS)[number];

export const KYC_STATUS_OPTIONS = [
  "VERIFIED",
  "NOT_VERIFIED",
  "PENDING",
  "UNKNOWN",
] as const;
export type KycStatus = (typeof KYC_STATUS_OPTIONS)[number];

export const USER_TYPE_OPTIONS = ["INDIVIDUAL", "BUSINESS"] as const;
export type WalletUserType = (typeof USER_TYPE_OPTIONS)[number];

export const BANK_ACCOUNT_MATCHING_STATUS_OPTIONS = [
  "UNKNOWN",
  "MATCHED",
  "NOT_MATCHED",
] as const;
export type BankAccountNameMatchingStatus =
  (typeof BANK_ACCOUNT_MATCHING_STATUS_OPTIONS)[number];

export interface WalletAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface Wallet {
  id: string;
  amountInLowestDenom: number;
  color: WalletColor;
  deviceToken: string | null;
  name: string;
  fullName?: string | null;
  emailAddress?: string | null;
  birthday?: string | null;
  requiredCounterpartyFields: RequiredCounterpartyField[];
  bankAccountNameMatchingStatus: BankAccountNameMatchingStatus;
  phoneNumber?: string | null;
  nationality?: string | null;
  countryOfResidence?: string | null;
  taxId?: string | null;
  financialInstitutionLei?: string | null;
  accountName?: string | null;
  accountIdentifier?: string | null;
  userType: WalletUserType | null;
  fiLegalEntityName?: string | null;
  ultimateInstitutionCountry?: string | null;
  kycStatus: KycStatus;
  address?: WalletAddress | null;
  uma: Uma;
  currency: Currency;
}

export interface RawWalletAddress {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
}

export interface RawWallet {
  id: string;
  amount_in_lowest_denom: number;
  color: RawWalletColor;
  device_token: string | null;
  full_name?: string | null;
  email_address?: string | null;
  birthday?: string | null;
  required_counterparty_fields?: RequiredCounterpartyField[];
  bank_account_name_matching_status?: BankAccountNameMatchingStatus | null;
  phone_number?: string | null;
  nationality?: string | null;
  country_of_residence?: string | null;
  tax_id?: string | null;
  financial_institution_lei?: string | null;
  account_name?: string | null;
  account_identifier?: string | null;
  user_type?: WalletUserType | null;
  fi_legal_entity_name?: string | null;
  ultimate_institution_country?: string | null;
  kyc_status?: KycStatus | null;
  address?: RawWalletAddress | null;
  uma: RawUma;
  currency: Currency;
}

export interface WalletContextData {
  wallets: Wallet[] | undefined;
  fetchWallets: () => Promise<Wallet[] | undefined>;
  error?: string;
  isLoading: boolean;
  pollingEnabled: boolean;
  setPollingEnabled: (enabled: boolean) => void;
  pollingInterval: number;
  setPollingInterval: (interval: number) => void;
}

const Context = React.createContext<WalletContextData>(null!);

export const mapRawWalletToWallet = (rawWallet: RawWallet): Wallet => {
  const color = RAW_WALLET_COLOR_MAPPING[rawWallet.color] ?? WalletColor.BLACK;
  const requiredCounterpartyFields =
    rawWallet.required_counterparty_fields ?? [];
  const address = rawWallet.address
    ? {
        line1: rawWallet.address.line1 ?? "",
        line2: rawWallet.address.line2 ?? "",
        city: rawWallet.address.city ?? "",
        state: rawWallet.address.state ?? "",
        country: rawWallet.address.country ?? "",
        postalCode: rawWallet.address.postalCode ?? "",
      }
    : undefined;

  const wallet: Wallet = {
    id: rawWallet.id,
    amountInLowestDenom: rawWallet.amount_in_lowest_denom,
    color,
    deviceToken: rawWallet.device_token,
    name: rawWallet.full_name ?? "",
    fullName: rawWallet.full_name ?? "",
    emailAddress: rawWallet.email_address ?? "",
    birthday: rawWallet.birthday ?? "",
    requiredCounterpartyFields,
    bankAccountNameMatchingStatus:
      rawWallet.bank_account_name_matching_status ?? "UNKNOWN",
    phoneNumber: rawWallet.phone_number ?? "",
    nationality: rawWallet.nationality ?? "",
    countryOfResidence: rawWallet.country_of_residence ?? "",
    taxId: rawWallet.tax_id ?? "",
    financialInstitutionLei: rawWallet.financial_institution_lei ?? "",
    accountName: rawWallet.account_name ?? "",
    accountIdentifier: rawWallet.account_identifier ?? "",
    userType: rawWallet.user_type ?? null,
    fiLegalEntityName: rawWallet.fi_legal_entity_name ?? "",
    ultimateInstitutionCountry: rawWallet.ultimate_institution_country ?? "",
    kycStatus: rawWallet.kyc_status ?? "UNKNOWN",
    address,
    uma: {
      userId: rawWallet.uma.user_id,
      username: rawWallet.uma.username,
      default: rawWallet.uma.default,
    },
    currency: rawWallet.currency,
  };

  return wallet;
};

export const fetchWallets = async (): Promise<Wallet[]> => {
  const res = await fetch(`${getBackendUrl()}/user/wallets`, {
    method: "GET",
    credentials: "include",
  });
  if (res.ok) {
    const { wallets } = await (res.json() as Promise<{
      wallets?: RawWallet[];
    }>);

    return wallets?.map(mapRawWalletToWallet) || [];
  } else {
    throw new Error("Failed to fetch wallets.");
  }
};

export const WalletContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [wallets, setWallets] = useState<Wallet[]>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { currentWallet, setCurrentWallet } = useAppState();
  const hasCurrentWallet = !!currentWallet;

  const [pollingEnabled, setPollingEnabled] = useState<boolean>(true);
  const [pollingInterval, setPollingInterval] = useState<number>(3000);
  const fetchWalletsAndUpdateState = useCallback(
    async (ignore?: boolean, isPolling?: boolean) => {
      // Only show loading state on initial load, not during polling
      if (!isPolling) {
        setIsLoading(true);
      }
      try {
        const wallets = await fetchWallets();
        if (!ignore) {
          setWallets(wallets);
          const defaultWallet =
            wallets.find((wallet) => wallet.uma.default) || wallets[0];
          if (!hasCurrentWallet) {
            setCurrentWallet(defaultWallet);
          }
        }
        return wallets;
      } catch (e: unknown) {
        const error = e as Error;
        setError(error.message);
      } finally {
        if (!isPolling) {
          setIsLoading(false);
        }
      }
    },
    [hasCurrentWallet, setCurrentWallet],
  );

  useEffect(() => {
    async function fetchWalletsInternal() {
      await fetchWalletsAndUpdateState(ignore);
    }

    let ignore = false;
    fetchWalletsInternal();
    return () => {
      ignore = true;
    };
  }, [fetchWalletsAndUpdateState]);

  // Set up polling
  useInterval(() => {
    if (pollingEnabled) {
      fetchWalletsAndUpdateState(false, true); // Pass isPolling=true
    }
  }, pollingInterval);

  // Optimize polling - only poll when the app is in focus
  useEffect(() => {
    function handleFocus() {
      setPollingEnabled(true);
      // Fetch immediately when gaining focus
      fetchWalletsAndUpdateState(false, true);
    }

    function handleBlur() {
      setPollingEnabled(false);
    }

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [fetchWalletsAndUpdateState]);

  return (
    <Context.Provider
      value={{
        wallets,
        fetchWallets: fetchWalletsAndUpdateState,
        error,
        isLoading,
        pollingEnabled,
        setPollingEnabled,
        pollingInterval,
        setPollingInterval,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export const useWallets = () => {
  return React.useContext(Context);
};

export default WalletContextProvider;
