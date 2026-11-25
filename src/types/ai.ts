export type RoutingPreference =
  | "prefer_on_device"
  | "only_on_device"
  | "prefer_in_cloud"
  | "only_in_cloud";

export type ActualInferenceSource = "ON_DEVICE" | "IN_CLOUD" | "DEMO_FALLBACK";

export type AIActionType =
  | "summarize"
  | "action_items"
  | "rewrite"
  | "privacy_audit"
  | "custom_ask";

export interface WorkspaceNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: number;
  isSensitive: boolean;
  lastAIOutput?: string;
  lastInferenceSource?: ActualInferenceSource;
}

export interface InferenceTelemetryEntry {
  id: string;
  timestamp: number;
  action: AIActionType;
  requestedMode: RoutingPreference;
  actualSource: ActualInferenceSource;
  latencyMs: number;
  modelUsed: string;
  piiRedactedCount: number;
  promptPreview: string;
  offlineAtRequest: boolean;
}

export interface RemoteAIConfig {
  defaultMode: RoutingPreference;
  cloudModelName: string;
  maxCloudInputChars: number;
  enableAutoPiiShield: boolean;
}

export interface FirebaseStatus {
  isConfigured: boolean;
  appCheckEnabled: boolean;
  appCheckMode: "recaptcha" | "debug" | "unconfigured";
  remoteConfigLoaded: boolean;
  firestoreReady: boolean;
  authReady: boolean;
  onDeviceCapabilities: "available" | "downloadable" | "unavailable" | "unknown";
}
