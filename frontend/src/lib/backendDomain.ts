import isDevelopment from "./isDevelopment";

export const getBackendDomain = () => {
  if (isDevelopment) {
    const backendDomain = process.env.NEXT_PUBLIC_BACKEND_DOMAIN;
    return backendDomain && new URL(backendDomain).host;
  } else if (typeof window !== "undefined") {
    return window.location.host;
  }

  // Should never happen, here for type safety during nextjs build
  return "";
};
