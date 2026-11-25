import { Cloud, Cpu, ShieldAlert, Zap } from "lucide-react";
import type { ActualInferenceSource } from "../types/ai";

interface HybridStatusBadgeProps {
  source?: ActualInferenceSource;
  latencyMs?: number;
  piiRedactedCount?: number;
}

export function HybridStatusBadge({
  source,
  latencyMs,
  piiRedactedCount = 0,
}: HybridStatusBadgeProps) {
  if (!source) {
    return (
      <span className="badge badge-neutral">
        <Zap size={13} />
        Ready for Hybrid Inference
      </span>
    );
  }

  return (
    <div className="badge-group">
      {source === "ON_DEVICE" && (
        <span className="badge badge-on-device">
          <Cpu size={13} />
          On-Device (Gemini Nano)
        </span>
      )}
      {source === "IN_CLOUD" && (
        <span className="badge badge-cloud">
          <Cloud size={13} />
          Cloud Fallback (Gemini)
        </span>
      )}
      {source === "DEMO_FALLBACK" && (
        <span className="badge badge-demo">
          <ShieldAlert size={13} />
          Preview Mode (.env required)
        </span>
      )}
      {typeof latencyMs === "number" && (
        <span className="badge badge-neutral">{latencyMs} ms</span>
      )}
      {piiRedactedCount > 0 && (
        <span className="badge badge-shield">
          {piiRedactedCount} PII scrubbed locally
        </span>
      )}
    </div>
  );
}
