export const getBackendUrl = () => {
  const backendDomain = process.env.NEXT_PUBLIC_BACKEND_DOMAIN;
  return `${backendDomain}api`;
};
