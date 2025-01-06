import { useEffect, useState } from "react";
import { useMediaQuery } from "./use-media-query";

export const usePwaInstallStatus = () => {
  const isInstalled = useMediaQuery("(display-mode: standalone)");
  const [userAgent, setUserAgent] = useState("");
  const isIOS = /iPhone/.test(userAgent);
  const isAndroid = /android/i.test(userAgent);

  useEffect(() => {
    if (navigator) {
      setUserAgent(navigator.userAgent);
    }
  }, []);

  return {
    isInstalled,
    deviceType: isIOS ? "ios" : isAndroid ? "android" : "other",
  };
};
