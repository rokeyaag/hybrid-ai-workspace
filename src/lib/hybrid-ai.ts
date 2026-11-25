import {
  getGenerativeModel,
  InferenceMode,
  InferenceSource,
} from "firebase/ai";
import { getFirebaseServices, isFirebaseConfigured } from "./firebase";
import { redactPiiLocally } from "./pii";
import type {
  AIActionType,
  ActualInferenceSource,
  InferenceTelemetryEntry,
  RoutingPreference,
} from "../types/ai";

export interface HybridExecutionRequest {
  action: AIActionType;
  noteTitle: string;
  noteContent: string;
  customQuestion?: string;
  routingMode: RoutingPreference;
  cloudModelName: string;
  enablePiiShield: boolean;
}

export interface HybridExecutionResponse {
  outputText: string;
  telemetry: InferenceTelemetryEntry;
  redactedTypes: string[];
}

function toSdkInferenceMode(preference: RoutingPreference): InferenceMode {
  switch (preference) {
    case "only_on_device":
      return InferenceMode.ONLY_ON_DEVICE;
    case "prefer_in_cloud":
      return InferenceMode.PREFER_IN_CLOUD;
    case "only_in_cloud":
      return InferenceMode.ONLY_IN_CLOUD;
    case "prefer_on_device":
    default:
      return InferenceMode.PREFER_ON_DEVICE;
  }
}

function buildPrompt(
  action: AIActionType,
  title: string,
  content: string,
  customQuestion?: string
): string {
  const doc = `Title: ${title || "Untitled Note"}\n\nContent:\n${content}`;

  switch (action) {
    case "summarize":
      return `Provide a crisp, structured executive summary (3-5 bullet points) of the following note.\n\n${doc}`;
    case "action_items":
      return `Extract concrete, prioritized action items and next steps from this note. Return a clean checklist.\n\n${doc}`;
    case "rewrite":
      return `Rewrite and polish the following note so it is clear, concise, and ready to share professionally while preserving all facts.\n\n${doc}`;
    case "privacy_audit":
      return `Analyze this note for sensitive operational details, privacy risks, or exposed secrets, and suggest safer wording.\n\n${doc}`;
    case "custom_ask":
    default:
      return `Answer the user's question accurately using the note below as primary context.\n\nQuestion: ${customQuestion || "What are the key takeaways?"}\n\n${doc}`;
  }
}

export async function checkChromeOnDeviceAvailability(): Promise<
  "available" | "downloadable" | "unavailable" | "unknown"
> {
  try {
    const languageModelApi = (
      globalThis as unknown as {
        LanguageModel?: { availability?: () => Promise<string> };
      }
    ).LanguageModel;

    if (!languageModelApi || typeof languageModelApi.availability !== "function") {
      return "unavailable";
    }

    const status = await languageModelApi.availability();
    if (status === "available") return "available";
    if (status === "downloadable" || status === "downloading") return "downloadable";
    return "unavailable";
  } catch {
    return "unknown";
  }
}

/**
 * Triggers Chrome's built-in Gemini Nano download via Firebase AI Logic SDK.
 * Must be called from a user gesture (button click).
 */
export async function prepareOnDeviceModel(
  cloudModelName: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  const { ai } = getFirebaseServices();
  if (!ai) {
    throw new Error("Configure Firebase environment variables (.env) before initializing the model.");
  }

  const model = getGenerativeModel(ai, {
    mode: InferenceMode.PREFER_ON_DEVICE,
    inCloudParams: {
      model: cloudModelName,
    },
  });

  await model.initializeDeviceModel(onProgress);
}

/**
 * Runs an AI task through Firebase AI Logic Hybrid Inference,
 * optionally applying local PII redaction first.
 */
export async function runHybridAIAction(
  req: HybridExecutionRequest
): Promise<HybridExecutionResponse> {
  const startedAt = performance.now();
  const isOffline = typeof navigator !== "undefined" ? !navigator.onLine : false;

  // Step 1: Optional Local PII Redaction before prompt leaves device
  let processedContent = req.noteContent;
  let redactedCount = 0;
  let redactedTypes: string[] = [];

  if (req.enablePiiShield) {
    const piiResult = redactPiiLocally(req.noteContent);
    processedContent = piiResult.sanitizedText;
    redactedCount = piiResult.redactedCount;
    redactedTypes = piiResult.redactedTypes;
  }

  const prompt = buildPrompt(
    req.action,
    req.noteTitle,
    processedContent,
    req.customQuestion
  );

  // Step 2: Execute via Firebase AI Logic when configured
  const { ai } = getFirebaseServices();
  if (isFirebaseConfigured() && ai) {
    const sdkMode = toSdkInferenceMode(req.routingMode);
    const model = getGenerativeModel(ai, {
      mode: sdkMode,
      inCloudParams: {
        model: req.cloudModelName,
        systemInstruction:
          "You are Hybrid AI Workspace assistant. Be concise, accurate, and formatting-friendly with Markdown.",
      },
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const latencyMs = Math.round(performance.now() - startedAt);

    const sdkSource = result.response.inferenceSource;
    const actualSource: ActualInferenceSource =
      sdkSource === InferenceSource.ON_DEVICE ? "ON_DEVICE" : "IN_CLOUD";

    const modelUsed =
      actualSource === "ON_DEVICE" ? "gemini-nano (on-device)" : req.cloudModelName;

    return {
      outputText: responseText,
      redactedTypes,
      telemetry: {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        action: req.action,
        requestedMode: req.routingMode,
        actualSource,
        latencyMs,
        modelUsed,
        piiRedactedCount: redactedCount,
        promptPreview: prompt.slice(0, 90),
        offlineAtRequest: isOffline,
      },
    };
  }

  // Step 3: Explicit Preview Mode when Firebase .env has not been connected yet
  const latencyMs = Math.round(performance.now() - startedAt);
  const previewLines = [
    `> **Firebase Preview Mode** — Add your Firebase credentials to \`.env\` to execute live Gemini Nano / Cloud Gemini inference via Firebase AI Logic.`,
    ``,
    `**Requested Mode:** \`${req.routingMode}\` | **PII Redacted Locally:** ${redactedCount} item(s)`,
    ``,
    `**Sanitized Input Preview:**`,
    `\`\`\`text`,
    processedContent.slice(0, 320) + (processedContent.length > 320 ? "..." : ""),
    `\`\`\``,
  ];

  return {
    outputText: previewLines.join("\n"),
    redactedTypes,
    telemetry: {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      action: req.action,
      requestedMode: req.routingMode,
      actualSource: "DEMO_FALLBACK",
      latencyMs,
      modelUsed: "preview-not-connected",
      piiRedactedCount: redactedCount,
      promptPreview: prompt.slice(0, 90),
      offlineAtRequest: isOffline,
    },
  };
}
