import { getBackendUrl } from "@/lib/backendUrl";
import { UmaError } from "@/types/UmaError";
import { type UmaLookupResponse } from "@/types/UmaLookupResponse";
import {
  type CreatePayreqError,
  type UmaPayreqResponse,
} from "@/types/UmaPayreqResponse";

export const lnurlpLookup = async (uma: string): Promise<UmaLookupResponse> => {
  const lookupRes = await fetch(`${getBackendUrl()}/api/umalookup/${uma}`, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
  }).then((res) => res.json() as Promise<UmaLookupResponse>);
  console.log("lookupRes", lookupRes);

  if (!lookupRes.callbackUuid) {
    console.error("Failed to lookup uma", lookupRes);
    throw new UmaError("Failed to lookup uma. Please try again.", lookupRes);
  }

  return lookupRes;
};

export const createPayreq = async (
  lookupCallbackUuid: string,
  receivingAmount: number,
  receiverCurrencyCode = "SAT",
) => {
  const payReq = await fetch(
    `${getBackendUrl()}/api/umapayreq/${lookupCallbackUuid}?amount=${receivingAmount}&receivingCurrencyCode=${receiverCurrencyCode}`,
    {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    },
  ).then((res) => res.json() as Promise<UmaPayreqResponse | CreatePayreqError>);
  console.log("payReq", payReq);

  if (
    !(payReq as UmaPayreqResponse).callbackUuid ||
    !(payReq as UmaPayreqResponse).amountMsats
  ) {
    console.error("Failed to create payreq", payReq);
    throw new UmaError("Failed to create payreq. Please try again.", payReq);
  }

  return payReq as UmaPayreqResponse;
};

export const sendPayment = async (umaPayreqResponse: UmaPayreqResponse) => {
  const sendRes = await fetch(
    `${getBackendUrl()}/api/sendpayment/${umaPayreqResponse.callbackUuid}`,
    {
      method: "POST",
      credentials: "include",
    },
  ).then((res) => res.json());
  console.log("sendRes", sendRes);

  const paymentStatus = sendRes.status;
  if (!(paymentStatus === "SUCCESS")) {
    console.error("Failed to send payment", sendRes);
    throw new UmaError("Failed to send payment. Please try again.", sendRes);
  }
};
