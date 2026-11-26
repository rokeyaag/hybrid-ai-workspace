import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ShieldCheck, UserCircle2, WifiOff } from "lucide-react";
import { AuthModal } from "./components/AuthModal";
import { RoutingInspector } from "./components/RoutingInspector";
import { WorkspacePanel } from "./components/WorkspacePanel";
import { useHistorySync } from "./hooks/useHistorySync";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useRemoteModels } from "./hooks/useRemoteModels";
import { getFirebaseServices, isFirebaseConfigured } from "./lib/firebase";
import { checkChromeOnDeviceAvailability } from "./lib/hybrid-ai";
import type { FirebaseStatus } from "./types/ai";

export default function App() {
  const isOnline = useOnlineStatus();
  const { config: remoteConfig, remoteConfigLoaded } = useRemoteModels();

  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [onDeviceStatus, setOnDeviceStatus] = useState<
    FirebaseStatus["onDeviceCapabilities"]
  >("unknown");

  const { notes, telemetry, syncing, upsertNote, deleteNote, addTelemetry } =
    useHistorySync(user?.uid ?? null);

  const [activeNoteId, setActiveNoteId] = useState<string | null>(
    notes[0]?.id ?? null
  );

  const activeNote =
    notes.find((n) => n.id === activeNoteId) ?? notes[0] ?? null;

  const refreshCapabilities = useCallback(() => {
    void checkChromeOnDeviceAvailability().then(setOnDeviceStatus);
  }, []);

  useEffect(() => {
    refreshCapabilities();
  }, [refreshCapabilities]);

  useEffect(() => {
    const { auth } = getFirebaseServices();
    if (!auth) return;
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
    });
  }, []);

  const services = getFirebaseServices();
  const status: FirebaseStatus = {
    isConfigured: isFirebaseConfigured(),
    appCheckEnabled: Boolean(services.appCheck),
    appCheckMode: services.appCheckMode,
    remoteConfigLoaded,
    firestoreReady: Boolean(services.db),
    authReady: Boolean(services.auth),
    onDeviceCapabilities: onDeviceStatus,
  };

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="brand">
          <img
            src="/logo.png"
            alt="Hybrid AI Workspace Monogram"
            className="brand-logo"
          />
          <div>
            <h1>Hybrid AI Workspace</h1>
            <p className="brand-subtitle">
              Firebase AI Logic • Gemini Nano On-Device + Cloud Fallback
            </p>
          </div>
        </div>

        <div className="nav-actions">
          {!isOnline && (
            <span className="pill pill-warn">
              <WifiOff size={13} />
              Offline Mode (Local AI Ready)
            </span>
          )}
          {syncing && <span className="pill pill-muted">Syncing Firestore...</span>}
          <span className="pill pill-ok">
            <ShieldCheck size={13} />
            App Check: {status.appCheckMode}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setAuthModalOpen(true)}
          >
            <UserCircle2 size={15} />
            {user ? user.displayName || "Guest" : "Sign In"}
          </button>
        </div>
      </header>

      <main className="main-layout">
        <WorkspacePanel
          notes={notes}
          activeNote={activeNote}
          remoteConfig={remoteConfig}
          onSelectNote={setActiveNoteId}
          onUpsertNote={upsertNote}
          onDeleteNote={deleteNote}
          onRecordTelemetry={addTelemetry}
        />

        <RoutingInspector
          status={status}
          isOnline={isOnline}
          remoteConfig={remoteConfig}
          telemetry={telemetry}
          onRefreshCapabilities={refreshCapabilities}
        />
      </main>

      {authModalOpen && (
        <AuthModal user={user} onClose={() => setAuthModalOpen(false)} />
      )}
    </div>
  );
}
