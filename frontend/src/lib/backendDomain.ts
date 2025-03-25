export const getBackendDomain = () => {
  if (typeof window !== "undefined") {
    return (
      (process.env.NEXT_PUBLIC_BACKEND_DOMAIN &&
        new URL(process.env.NEXT_PUBLIC_BACKEND_DOMAIN).host) ||
      window.location.host
    );
  }
  return "";
};
