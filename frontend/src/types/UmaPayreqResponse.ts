import { type Currency } from "./Currency";

export interface UmaPayreqResponse {
  senderCurrencies: Currency[];
  callbackUuid: string;
  encodedInvoice: string;
  amountMsats: number;
  conversionRate: number;
  exchangeFeesMsats: number;
  receivingCurrencyCode: string;
  amountReceivingCurrency: string;
}

export interface CreatePayreqError {
  reason: string;
  status: string;
}
