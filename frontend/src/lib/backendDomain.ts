import assert from "assert";
import isDevelopment from "./isDevelopment";

export const getBackendDomain = () => {
  if (typeof window !== "undefined") {
    if (isDevelopment) {
      assert(
        process.env.BACKEND_DOMAIN,
        "BACKEND_DOMAIN environment variable must be set in development mode.",
      );
      return process.env.BACKEND_DOMAIN;
    }

    return window.location.host;
  }
};
