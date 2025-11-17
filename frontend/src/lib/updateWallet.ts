import {
  type Wallet,
  type WalletAddress,
  type RawWallet,
  mapRawWalletToWallet,
} from "@/hooks/useWalletContext";
import { getBackendUrl } from "./backendUrl";
import {
  RAW_WALLET_COLOR_TO_NUMBER_MAPPING,
  WalletColor,
} from "./walletColorMapping";

export type WalletUpdatePayload = Partial<
  Pick<
    Wallet,
    | "color"
    | "requiredCounterpartyFields"
    | "kycStatus"
    | "userType"
    | "bankAccountNameMatchingStatus"
    | "fullName"
    | "emailAddress"
    | "birthday"
    | "address"
    | "taxId"
    | "phoneNumber"
    | "nationality"
    | "countryOfResidence"
    | "accountName"
    | "accountIdentifier"
    | "fiLegalEntityName"
    | "financialInstitutionLei"
    | "ultimateInstitutionCountry"
  >
> & {
  currencyCode?: string | null;
};

const toNullableString = (value?: string | null) => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeAddress = (address?: WalletAddress | null) => {
  if (!address) {
    return null;
  }
  const cleaned: WalletAddress = {
    line1: toNullableString(address.line1) ?? undefined,
    line2: toNullableString(address.line2) ?? undefined,
    city: toNullableString(address.city) ?? undefined,
    state: toNullableString(address.state) ?? undefined,
    country: toNullableString(address.country) ?? undefined,
    postalCode: toNullableString(address.postalCode) ?? undefined,
  };
  const hasValue = Object.values(cleaned).some((value) => value);
  return hasValue ? cleaned : null;
};

export const updateWallet = async (
  walletId: string,
  payload: WalletUpdatePayload,
  method: "POST" | "PUT" = "PUT",
): Promise<Wallet> => {
  const body: Record<string, unknown> = {};

  if (payload.color !== undefined) {
    body.color =
      payload.color === null
        ? null
        : RAW_WALLET_COLOR_TO_NUMBER_MAPPING[payload.color];
  }
  if (payload.currencyCode !== undefined) {
    body.currencyCode = payload.currencyCode;
  }
  if (payload.requiredCounterpartyFields !== undefined) {
    body.required_counterparty_fields = payload.requiredCounterpartyFields;
  }
  if (payload.kycStatus !== undefined) {
    body.kyc_status = payload.kycStatus;
  }
  if (payload.userType !== undefined) {
    body.user_type = payload.userType;
  }
  if (payload.bankAccountNameMatchingStatus !== undefined) {
    body.bank_account_name_matching_status =
      payload.bankAccountNameMatchingStatus;
  }
  if (payload.fullName !== undefined) {
    body.full_name = toNullableString(payload.fullName);
  }
  if (payload.emailAddress !== undefined) {
    body.email_address = toNullableString(payload.emailAddress);
  }
  if (payload.birthday !== undefined) {
    body.birthday = toNullableString(payload.birthday);
  }
  if (payload.address !== undefined) {
    body.address = normalizeAddress(payload.address);
  }
  if (payload.taxId !== undefined) {
    body.tax_id = toNullableString(payload.taxId);
  }
  if (payload.phoneNumber !== undefined) {
    body.phone_number = toNullableString(payload.phoneNumber);
  }
  if (payload.nationality !== undefined) {
    body.nationality = toNullableString(payload.nationality);
  }
  if (payload.countryOfResidence !== undefined) {
    body.country_of_residence = toNullableString(payload.countryOfResidence);
  }
  if (payload.accountName !== undefined) {
    body.account_name = toNullableString(payload.accountName);
  }
  if (payload.accountIdentifier !== undefined) {
    body.account_identifier = toNullableString(payload.accountIdentifier);
  }
  if (payload.fiLegalEntityName !== undefined) {
    body.fi_legal_entity_name = toNullableString(payload.fiLegalEntityName);
  }
  if (payload.financialInstitutionLei !== undefined) {
    body.financial_institution_lei = toNullableString(
      payload.financialInstitutionLei,
    );
  }
  if (payload.ultimateInstitutionCountry !== undefined) {
    body.ultimate_institution_country = toNullableString(
      payload.ultimateInstitutionCountry,
    );
  }

  const response = await fetch(`${getBackendUrl()}/user/wallets/${walletId}`, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage || "Failed to update wallet.");
  }

  const wallet = (await response.json()) as RawWallet;
  return mapRawWalletToWallet(wallet);
};
