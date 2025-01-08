import { getBackendUrl } from "./backendUrl";

export const deleteWallet = async (walletId: string): Promise<void> => {
  const response = await fetch(`${getBackendUrl()}/user/wallet/${walletId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to delete wallet.");
  }
};
