import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  type AppCheck,
} from "firebase/app-check";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getRemoteConfig, type RemoteConfig } from "firebase/remote-config";
import { getAI, GoogleAIBackend, type AI } from "firebase/ai";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.appId &&
      firebaseConfig.apiKey !== "your_api_key"
  );
}

export interface FirebaseServices {
  app: FirebaseApp | null;
  appCheck: AppCheck | null;
  auth: Auth | null;
  googleProvider: GoogleAuthProvider | null;
  db: Firestore | null;
  remoteConfig: RemoteConfig | null;
  ai: AI | null;
  appCheckMode: "recaptcha" | "debug" | "unconfigured";
}

let cachedServices: FirebaseServices | null = null;

export function getFirebaseServices(): FirebaseServices {
  if (cachedServices) {
    return cachedServices;
  }

  if (!isFirebaseConfigured()) {
    cachedServices = {
      app: null,
      appCheck: null,
      auth: null,
      googleProvider: null,
      db: null,
      remoteConfig: null,
      ai: null,
      appCheckMode: "unconfigured",
    };
    return cachedServices;
  }

  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

  // Configure Firebase App Check (Mandatory for Firebase AI Logic)
  const debugTokenEnv = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN as string | undefined;
  const siteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY as string | undefined;
  let appCheck: AppCheck | null = null;
  let appCheckMode: "recaptcha" | "debug" | "unconfigured" = "unconfigured";

  if (typeof window !== "undefined") {
    const globalScope = window as unknown as Record<string, unknown>;
    if (debugTokenEnv === "true") {
      globalScope.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      appCheckMode = "debug";
    } else if (debugTokenEnv && debugTokenEnv.trim().length > 0) {
      globalScope.FIREBASE_APPCHECK_DEBUG_TOKEN = debugTokenEnv.trim();
      appCheckMode = "debug";
    }

    if (siteKey && siteKey.trim().length > 0) {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(siteKey.trim()),
        isTokenAutoRefreshEnabled: true,
      });
      if (appCheckMode !== "debug") {
        appCheckMode = "recaptcha";
      }
    } else if (appCheckMode === "debug") {
      // Uses placeholder key when debug token is active in local/hackathon testing
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider("debug-placeholder-site-key"),
        isTokenAutoRefreshEnabled: true,
      });
    }
  }

  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();
  const db = getFirestore(app);
  const remoteConfig = getRemoteConfig(app);
  remoteConfig.settings.minimumFetchIntervalMillis = 60_000;
  remoteConfig.defaultConfig = {
    default_inference_mode: "prefer_on_device",
    cloud_model_name: "gemini-3.5-flash-lite",
    max_cloud_input_chars: 12000,
    enable_auto_pii_shield: true,
  };

  // Initialize Firebase AI Logic with GoogleAIBackend (supports Hybrid Inference)
  const ai = getAI(app, { backend: new GoogleAIBackend() });

  cachedServices = {
    app,
    appCheck,
    auth,
    googleProvider,
    db,
    remoteConfig,
    ai,
    appCheckMode,
  };

  return cachedServices;
}
