import { getBackendUrl } from "./backendUrl";

export const revokePasskey = async (
  webAuthnCredentialId: string,
): Promise<void> => {
  const response = await fetch(
    `${getBackendUrl()}/user/webauthn/${webAuthnCredentialId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );
  if (!response.ok) {
    throw new Error("Failed to delete passkey.");
  }
};
