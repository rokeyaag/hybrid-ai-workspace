import { useState } from "react";
import {
  CheckSquare,
  FileText,
  Lock,
  Plus,
  Send,
  Shield,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { runHybridAIAction } from "../lib/hybrid-ai";
import { HybridStatusBadge } from "./HybridStatusBadge";
import { MarkdownView } from "./MarkdownView";
import type {
  AIActionType,
  InferenceTelemetryEntry,
  RemoteAIConfig,
  RoutingPreference,
  WorkspaceNote,
} from "../types/ai";

interface WorkspacePanelProps {
  notes: WorkspaceNote[];
  activeNote: WorkspaceNote | null;
  remoteConfig: RemoteAIConfig;
  onSelectNote: (id: string) => void;
  onUpsertNote: (note: WorkspaceNote) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  onRecordTelemetry: (entry: InferenceTelemetryEntry) => Promise<void>;
}

export function WorkspacePanel({
  notes,
  activeNote,
  remoteConfig,
  onSelectNote,
  onUpsertNote,
  onDeleteNote,
  onRecordTelemetry,
}: WorkspacePanelProps) {
  const [routingMode, setRoutingMode] = useState<RoutingPreference>(
    remoteConfig.defaultMode
  );
  const [enablePiiShield, setEnablePiiShield] = useState<boolean>(
    remoteConfig.enableAutoPiiShield
  );
  const [customQuestion, setCustomQuestion] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>("");
  const [lastTelemetry, setLastTelemetry] =
    useState<InferenceTelemetryEntry | null>(null);

  function handleCreateNote() {
    const newNote: WorkspaceNote = {
      id: crypto.randomUUID(),
      title: "Untitled Workspace Note",
      content: "",
      tags: ["draft"],
      updatedAt: Date.now(),
      isSensitive: false,
    };
    void onUpsertNote(newNote);
    onSelectNote(newNote.id);
  }

  async function handleRunAction(action: AIActionType) {
    if (!activeNote || isRunning) return;
    if (!activeNote.content.trim()) {
      setAiError("Add some content to the note first before running Hybrid AI.");
      return;
    }

    setIsRunning(true);
    setAiError("");

    try {
      const result = await runHybridAIAction({
        action,
        noteTitle: activeNote.title,
        noteContent: activeNote.content,
        customQuestion: customQuestion.trim() || undefined,
        routingMode,
        cloudModelName: remoteConfig.cloudModelName,
        enablePiiShield,
      });

      setLastTelemetry(result.telemetry);
      await onRecordTelemetry(result.telemetry);
      await onUpsertNote({
        ...activeNote,
        lastAIOutput: result.outputText,
        lastInferenceSource: result.telemetry.actualSource,
        updatedAt: Date.now(),
      });

      if (action === "custom_ask") {
        setCustomQuestion("");
      }
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : "Hybrid inference request failed."
      );
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="workspace-grid">
      {/* Notes Sidebar */}
      <section className="notes-sidebar">
        <div className="sidebar-top">
          <h2>Workspace Notes</h2>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleCreateNote}
          >
            <Plus size={14} />
            New
          </button>
        </div>

        <div className="notes-list">
          {notes.map((note) => (
            <button
              key={note.id}
              type="button"
              className={`note-card ${
                activeNote?.id === note.id ? "note-card-active" : ""
              }`}
              onClick={() => onSelectNote(note.id)}
            >
              <div className="note-card-header">
                <span className="note-title">
                  {note.isSensitive && <Lock size={12} className="text-amber" />}
                  {note.title || "Untitled"}
                </span>
                {note.lastInferenceSource === "ON_DEVICE" && (
                  <span className="dot dot-emerald" title="Last run: On-Device" />
                )}
                {note.lastInferenceSource === "IN_CLOUD" && (
                  <span className="dot dot-sky" title="Last run: Cloud" />
                )}
              </div>
              <p className="note-snippet">
                {note.content.slice(0, 72) || "Empty note..."}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Main Editor + AI Output */}
      <section className="editor-area">
        {activeNote ? (
          <>
            <div className="editor-toolbar">
              <input
                type="text"
                className="title-input"
                value={activeNote.title}
                onChange={(e) =>
                  void onUpsertNote({
                    ...activeNote,
                    title: e.target.value,
                    updatedAt: Date.now(),
                  })
                }
                placeholder="Note title..."
              />
              <div className="toolbar-controls">
                <label className="toggle-chip">
                  <input
                    type="checkbox"
                    checked={enablePiiShield}
                    onChange={(e) => setEnablePiiShield(e.target.checked)}
                  />
                  <Shield size={13} />
                  Local PII Shield
                </label>

                <select
                  aria-label="Hybrid Inference Mode"
                  className="mode-select"
                  value={routingMode}
                  onChange={(e) =>
                    setRoutingMode(e.target.value as RoutingPreference)
                  }
                >
                  <option value="prefer_on_device">Prefer On-Device (Hybrid)</option>
                  <option value="only_on_device">Strict On-Device Only</option>
                  <option value="prefer_in_cloud">Prefer Cloud (Fallback Local)</option>
                  <option value="only_in_cloud">Cloud Only</option>
                </select>

                <button
                  type="button"
                  className="icon-btn danger-hover"
                  onClick={() => void onDeleteNote(activeNote.id)}
                  title="Delete note"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <textarea
              className="note-editor"
              value={activeNote.content}
              onChange={(e) =>
                void onUpsertNote({
                  ...activeNote,
                  content: e.target.value,
                  updatedAt: Date.now(),
                })
              }
              placeholder="Write notes, paste sensitive meeting transcripts, or test offline AI..."
            />

            <div className="ai-actions-bar">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={isRunning}
                onClick={() => void handleRunAction("summarize")}
              >
                <FileText size={14} />
                Summarize
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={isRunning}
                onClick={() => void handleRunAction("action_items")}
              >
                <CheckSquare size={14} />
                Action Items
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={isRunning}
                onClick={() => void handleRunAction("rewrite")}
              >
                <Wand2 size={14} />
                Rewrite
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={isRunning}
                onClick={() => void handleRunAction("privacy_audit")}
              >
                <Shield size={14} />
                Privacy Audit
              </button>
            </div>

            <form
              className="ask-form"
              onSubmit={(e) => {
                e.preventDefault();
                void handleRunAction("custom_ask");
              }}
            >
              <input
                type="text"
                className="ask-input"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Ask Hybrid AI anything about this note..."
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isRunning}
              >
                <Send size={14} />
                {isRunning ? "Running..." : "Ask"}
              </button>
            </form>

            {aiError && <div className="error-banner">{aiError}</div>}

            <div className="ai-output-card">
              <div className="ai-output-header">
                <span className="ai-output-title">
                  <Sparkles size={15} />
                  Hybrid AI Output
                </span>
                <HybridStatusBadge
                  source={
                    lastTelemetry?.actualSource ?? activeNote.lastInferenceSource
                  }
                  latencyMs={lastTelemetry?.latencyMs}
                  piiRedactedCount={lastTelemetry?.piiRedactedCount}
                />
              </div>
              <div className="ai-output-body">
                <MarkdownView
                  content={
                    activeNote.lastAIOutput ||
                    "Select an AI action above to run Firebase AI Logic Hybrid Inference."
                  }
                />
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>Select or create a note to start using Hybrid AI Workspace.</p>
          </div>
        )}
      </section>
    </div>
  );
}
