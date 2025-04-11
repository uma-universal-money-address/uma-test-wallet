export const getBackendUrl = ({
  withApiPrefix = true,
}: {
  withApiPrefix?: boolean;
} = {}) => {
  let backendDomain = process.env.NEXT_PUBLIC_BACKEND_DOMAIN;
  if (backendDomain?.endsWith("/")) {
    backendDomain = backendDomain.slice(0, -1);
  }

  return `${backendDomain}${withApiPrefix ? "/api" : ""}`;
};
