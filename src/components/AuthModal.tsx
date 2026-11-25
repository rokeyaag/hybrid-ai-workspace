import { useState } from "react";
import { signInAnonymously, signInWithPopup, signOut, type User } from "firebase/auth";
import { LogIn, LogOut, UserCheck, X } from "lucide-react";
import { getFirebaseServices, isFirebaseConfigured } from "../lib/firebase";

interface AuthModalProps {
  user: User | null;
  onClose: () => void;
}

export function AuthModal({ user, onClose }: AuthModalProps) {
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const configured = isFirebaseConfigured();

  async function handleGoogleSignIn() {
    const { auth, googleProvider } = getFirebaseServices();
    if (!auth || !googleProvider) {
      setError("Add Firebase credentials to .env to enable Authentication.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGuestSignIn() {
    const { auth } = getFirebaseServices();
    if (!auth) {
      setError("Add Firebase credentials to .env to enable Authentication.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signInAnonymously(auth);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Anonymous sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    const { auth } = getFirebaseServices();
    if (!auth) return;
    setBusy(true);
    try {
      await signOut(auth);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Firebase Authentication</h3>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close authentication modal"
          >
            <X size={16} />
          </button>
        </div>

        {!configured && (
          <p className="alert-box">
            Firebase is currently running in offline/local mode. Copy{" "}
            <code>.env.example</code> to <code>.env</code> with your Firebase Web
            config to sync notes to Firestore.
          </p>
        )}

        {user ? (
          <div className="auth-signed-in">
            <div className="user-pill">
              <UserCheck size={16} />
              <div>
                <strong>{user.displayName || "Guest Session"}</strong>
                <small>{user.email || `UID: ${user.uid.slice(0, 10)}...`}</small>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-danger btn-full"
              onClick={handleSignOut}
              disabled={busy}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="auth-actions">
            <p className="hint-text">
              Sign in to back up and sync workspace notes & telemetry to Cloud Firestore.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-full"
              onClick={handleGoogleSignIn}
              disabled={busy || !configured}
            >
              <LogIn size={14} />
              Continue with Google
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={handleGuestSignIn}
              disabled={busy || !configured}
            >
              Continue as Anonymous Guest
            </button>
          </div>
        )}

        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}
