import { useEffect, useState } from "react";
import { fetchAndActivate, getBoolean, getNumber, getString } from "firebase/remote-config";
import { getFirebaseServices } from "../lib/firebase";
import type { RemoteAIConfig, RoutingPreference } from "../types/ai";

const DEFAULT_REMOTE_CONFIG: RemoteAIConfig = {
  defaultMode: "prefer_on_device",
  cloudModelName: "gemini-3.5-flash-lite",
  maxCloudInputChars: 12000,
  enableAutoPiiShield: true,
};

function parseRoutingPreference(value: string): RoutingPreference {
  if (
    value === "prefer_on_device" ||
    value === "only_on_device" ||
    value === "prefer_in_cloud" ||
    value === "only_in_cloud"
  ) {
    return value;
  }
  return "prefer_on_device";
}

export function useRemoteModels(): {
  config: RemoteAIConfig;
  remoteConfigLoaded: boolean;
} {
  const [config, setConfig] = useState<RemoteAIConfig>(DEFAULT_REMOTE_CONFIG);
  const [remoteConfigLoaded, setRemoteConfigLoaded] = useState(false);

  useEffect(() => {
    const { remoteConfig } = getFirebaseServices();
    if (!remoteConfig) {
      return;
    }

    let cancelled = false;
    fetchAndActivate(remoteConfig)
      .then(() => {
        if (cancelled) return;
        setConfig({
          defaultMode: parseRoutingPreference(
            getString(remoteConfig, "default_inference_mode")
          ),
          cloudModelName:
            getString(remoteConfig, "cloud_model_name") ||
            DEFAULT_REMOTE_CONFIG.cloudModelName,
          maxCloudInputChars:
            getNumber(remoteConfig, "max_cloud_input_chars") ||
            DEFAULT_REMOTE_CONFIG.maxCloudInputChars,
          enableAutoPiiShield: getBoolean(remoteConfig, "enable_auto_pii_shield"),
        });
        setRemoteConfigLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setRemoteConfigLoaded(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { config, remoteConfigLoaded };
}
