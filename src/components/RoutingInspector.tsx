import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  Cloud,
  Cpu,
  Download,
  Lock,
  Radio,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import { prepareOnDeviceModel } from "../lib/hybrid-ai";
import type {
  FirebaseStatus,
  InferenceTelemetryEntry,
  RemoteAIConfig,
} from "../types/ai";

interface RoutingInspectorProps {
  status: FirebaseStatus;
  isOnline: boolean;
  remoteConfig: RemoteAIConfig;
  telemetry: InferenceTelemetryEntry[];
  onRefreshCapabilities: () => void;
}

export function RoutingInspector({
  status,
  isOnline,
  remoteConfig,
  telemetry,
  onRefreshCapabilities,
}: RoutingInspectorProps) {
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadMsg, setDownloadMsg] = useState<string>("");

  const totalCalls = telemetry.length;
  const onDeviceCalls = telemetry.filter((t) => t.actualSource === "ON_DEVICE").length;
  const cloudCalls = telemetry.filter((t) => t.actualSource === "IN_CLOUD").length;
  const piiSaved = telemetry.reduce((acc, t) => acc + t.piiRedactedCount, 0);
  const avgLatency =
    totalCalls > 0
      ? Math.round(telemetry.reduce((acc, t) => acc + t.latencyMs, 0) / totalCalls)
      : 0;

  async function handleWarmup() {
    try {
      setDownloadMsg("Initializing Gemini Nano...");
      setDownloadProgress(0);
      await prepareOnDeviceModel(remoteConfig.cloudModelName, (progress) => {
        setDownloadProgress(Math.round(progress * 100));
      });
      setDownloadProgress(100);
      setDownloadMsg("On-device Gemini Nano ready!");
      onRefreshCapabilities();
    } catch (err) {
      setDownloadProgress(null);
      setDownloadMsg(
        err instanceof Error ? err.message : "Failed to initialize on-device model."
      );
    }
  }

  return (
    <aside className="inspector-panel">
      <div className="panel-header">
        <Activity size={16} />
        <h2>Hybrid Routing Inspector</h2>
      </div>

      <div className="metric-grid">
        <div className="metric-card">
          <span className="metric-label">On-Device Runs</span>
          <strong className="metric-value text-emerald">{onDeviceCalls}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Cloud Fallbacks</span>
          <strong className="metric-value text-sky">{cloudCalls}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Avg Latency</span>
          <strong className="metric-value">{avgLatency} ms</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">PII Scrubbed</span>
          <strong className="metric-value text-amber">{piiSaved}</strong>
        </div>
      </div>

      <section className="inspector-section">
        <h3>Runtime & Firebase Stack</h3>
        <ul className="status-list">
          <li>
            <span>Network</span>
            <span className={isOnline ? "pill pill-ok" : "pill pill-warn"}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </li>
          <li>
            <span>Chrome Gemini Nano</span>
            <span
              className={
                status.onDeviceCapabilities === "available"
                  ? "pill pill-ok"
                  : "pill pill-muted"
              }
            >
              {status.onDeviceCapabilities}
            </span>
          </li>
          <li>
            <span>Firebase AI Logic</span>
            <span className={status.isConfigured ? "pill pill-ok" : "pill pill-warn"}>
              {status.isConfigured ? "Connected" : "Needs .env"}
            </span>
          </li>
          <li>
            <span>App Check</span>
            <span className={status.appCheckEnabled ? "pill pill-ok" : "pill pill-muted"}>
              <ShieldCheck size={12} />
              {status.appCheckMode}
            </span>
          </li>
          <li>
            <span>Remote Config</span>
            <span
              className={status.remoteConfigLoaded ? "pill pill-ok" : "pill pill-muted"}
            >
              <Radio size={12} />
              {status.remoteConfigLoaded ? "Synced" : "Defaults"}
            </span>
          </li>
          <li>
            <span>Cloud Fallback Model</span>
            <span className="pill pill-muted">{remoteConfig.cloudModelName}</span>
          </li>
        </ul>

        <button
          type="button"
          className="btn btn-secondary btn-full"
          onClick={handleWarmup}
        >
          <Download size={14} />
          Warm Up On-Device Gemini Nano
        </button>

        {downloadProgress !== null && (
          <div className="progress-bar-wrap">
            <div
              className="progress-bar-fill"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        )}
        {downloadMsg && <p className="hint-text">{downloadMsg}</p>}
      </section>

      <section className="inspector-section telemetry-section">
        <h3>Inference Telemetry Log</h3>
        {telemetry.length === 0 ? (
          <p className="hint-text">
            Run any AI action to observe live <code>inferenceSource</code> routing
            (<code>on_device</code> vs <code>in_cloud</code>).
          </p>
        ) : (
          <div className="telemetry-list">
            {telemetry.slice(0, 10).map((entry) => (
              <div key={entry.id} className="telemetry-item">
                <div className="telemetry-top">
                  <span className="telemetry-action">
                    {entry.actualSource === "ON_DEVICE" ? (
                      <Cpu size={12} className="text-emerald" />
                    ) : entry.actualSource === "IN_CLOUD" ? (
                      <Cloud size={12} className="text-sky" />
                    ) : (
                      <Lock size={12} className="text-amber" />
                    )}
                    {entry.action}
                  </span>
                  <span className="telemetry-latency">{entry.latencyMs} ms</span>
                </div>
                <div className="telemetry-meta">
                  <span>{entry.modelUsed}</span>
                  {entry.offlineAtRequest && (
                    <span className="offline-tag">
                      <WifiOff size={11} /> offline
                    </span>
                  )}
                  {entry.piiRedactedCount > 0 && (
                    <span className="shield-tag">
                      <CheckCircle2 size={11} /> {entry.piiRedactedCount} PII
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}
