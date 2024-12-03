import { type Currency } from "./Currency";

export interface UmaLookupResponse {
  senderCurrencies: Currency[];
  receiverCurrencies: Currency[];
  minSendableMsats: number;
  maxSendableMsats: number;
  callbackUuid: string;
  receiverKycStatus: string;
}
