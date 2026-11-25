import { useCallback, useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { getFirebaseServices } from "../lib/firebase";
import type { InferenceTelemetryEntry, WorkspaceNote } from "../types/ai";

const NOTES_STORAGE_KEY = "hybrid_ai_workspace_notes_v1";
const TELEMETRY_STORAGE_KEY = "hybrid_ai_workspace_telemetry_v1";

const STARTER_NOTES: WorkspaceNote[] = [
  {
    id: "starter-hybrid-note",
    title: "Hybrid AI Architecture Brief",
    content:
      "Our product processes quick summaries and private customer drafts on-device using Gemini Nano via Firebase AI Logic (InferenceMode.PREFER_ON_DEVICE). If a user opens the workspace on an unsupported browser or triggers complex multi-doc reasoning, Firebase AI Logic automatically falls back to Cloud Gemini protected by App Check.\n\nSample sensitive contact to test Local PII Shield:\nLead Engineer: dev@example.com | Phone: +1 (555) 234-5678",
    tags: ["architecture", "hybrid-ai", "privacy"],
    updatedAt: Date.now(),
    isSensitive: true,
  },
  {
    id: "starter-field-ops",
    title: "Offline Field Inspection Checklist",
    content:
      "Site B Inspection Notes (recorded offline):\n1. Backup generator battery at 88% capacity.\n2. HVAC filter replacement scheduled for Friday 10:00 AM.\n3. Need executive summary and action checklist synced once connectivity returns.",
    tags: ["offline", "field-ops"],
    updatedAt: Date.now() - 600_000,
    isSensitive: false,
  },
];

function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function useHistorySync(userId: string | null) {
  const [notes, setNotes] = useState<WorkspaceNote[]>(() =>
    loadLocal<WorkspaceNote[]>(NOTES_STORAGE_KEY, STARTER_NOTES)
  );
  const [telemetry, setTelemetry] = useState<InferenceTelemetryEntry[]>(() =>
    loadLocal<InferenceTelemetryEntry[]>(TELEMETRY_STORAGE_KEY, [])
  );
  const [syncing, setSyncing] = useState(false);

  // Persist locally immediately for offline-first reliability
  useEffect(() => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(telemetry));
  }, [telemetry]);

  // Pull cloud notes when signed in
  useEffect(() => {
    const { db } = getFirebaseServices();
    if (!db || !userId) return;

    let cancelled = false;
    setSyncing(true);

    const notesRef = collection(db, "users", userId, "notes");
    getDocs(query(notesRef, orderBy("updatedAt", "desc")))
      .then((snap) => {
        if (cancelled || snap.empty) return;
        const remoteNotes = snap.docs.map((d) => d.data() as WorkspaceNote);
        setNotes((prev) => {
          const merged = new Map<string, WorkspaceNote>();
          for (const n of prev) merged.set(n.id, n);
          for (const r of remoteNotes) {
            const existing = merged.get(r.id);
            if (!existing || r.updatedAt >= existing.updatedAt) {
              merged.set(r.id, r);
            }
          }
          return Array.from(merged.values()).sort((a, b) => b.updatedAt - a.updatedAt);
        });
      })
      .catch(() => {
        // Offline or Firestore not enabled yet — local cache remains active
      })
      .finally(() => {
        if (!cancelled) setSyncing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const upsertNote = useCallback(
    async (note: WorkspaceNote) => {
      setNotes((prev) => {
        const exists = prev.some((n) => n.id === note.id);
        const next = exists
          ? prev.map((n) => (n.id === note.id ? note : n))
          : [note, ...prev];
        return next.sort((a, b) => b.updatedAt - a.updatedAt);
      });

      const { db } = getFirebaseServices();
      if (db && userId && navigator.onLine) {
        try {
          await setDoc(doc(db, "users", userId, "notes", note.id), note);
        } catch {
          // Safe to ignore when offline; local state preserved
        }
      }
    },
    [userId]
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      const { db } = getFirebaseServices();
      if (db && userId && navigator.onLine) {
        try {
          await deleteDoc(doc(db, "users", userId, "notes", noteId));
        } catch {
          // Safe to ignore
        }
      }
    },
    [userId]
  );

  const addTelemetry = useCallback(
    async (entry: InferenceTelemetryEntry) => {
      setTelemetry((prev) => [entry, ...prev].slice(0, 40));
      const { db } = getFirebaseServices();
      if (db && userId && navigator.onLine) {
        try {
          await setDoc(doc(db, "users", userId, "telemetry", entry.id), entry);
        } catch {
          // Safe to ignore
        }
      }
    },
    [userId]
  );

  return {
    notes,
    telemetry,
    syncing,
    upsertNote,
    deleteNote,
    addTelemetry,
  };
}
