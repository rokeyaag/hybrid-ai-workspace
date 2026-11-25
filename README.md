# Hybrid AI Workspace

> Built for **#BuildHybridAI 2026** — A privacy-first, offline-capable AI knowledge workspace powered by **Firebase AI Logic Hybrid Inference** (on-device Gemini Nano + automatic Cloud Gemini fallback).

## Why Hybrid AI?

- **Local-First & Zero-Cost Inference (`PREFER_ON_DEVICE`):** Runs instant summaries, rewrites, action extraction, and privacy audits on-device using Chrome's built-in **Gemini Nano** when supported—even offline.
- **Seamless Cloud Fallback (`inCloudParams`):** Automatically routes requests to Cloud Gemini when the browser lacks Gemini Nano support or when cloud reasoning is selected.
- **Local PII Privacy Shield:** Scrubs emails, phone numbers, credit cards, SSNs, and API tokens locally in the browser before prompts ever leave the device.
- **Live Hybrid Routing Inspector:** Exposes real-time `result.response.inferenceSource` (`on_device` vs `in_cloud`), latency (`ms`), Chrome `LanguageModel.availability()`, and Firebase service health.

## Firebase Stack Used

- **Firebase AI Logic (`firebase/ai`):** `getAI`, `getGenerativeModel`, `GoogleAIBackend`, `InferenceMode` (`PREFER_ON_DEVICE`, `ONLY_ON_DEVICE`, `PREFER_IN_CLOUD`, `ONLY_IN_CLOUD`), `initializeDeviceModel`, and `inferenceSource` inspection.
- **Firebase App Check:** Mandatory attestation via reCAPTCHA Enterprise and Debug Token support (`FIREBASE_APPCHECK_DEBUG_TOKEN`).
- **Firebase Authentication:** Google Sign-In & Anonymous Guest sessions.
- **Cloud Firestore:** Cross-device sync for notes and inference telemetry when online, backed by instant `localStorage` persistence when offline.
- **Firebase Remote Config:** Dynamic control over default inference mode, cloud fallback model (`gemini-3.5-flash-lite`), and PII shield defaults.

## Project Structure

```text
hybrid-ai-workspace/
├── LICENSE                  # Apache 2.0 License
├── README.md
├── .env.example             # Environment variable template
├── firebase.json            # Firebase Hosting & Firestore config
├── firestore.rules          # Per-user Firestore security rules
└── src/
    ├── lib/
    │   ├── firebase.ts      # Firebase App, App Check, Auth, Firestore, Remote Config & AI Logic init
    │   ├── hybrid-ai.ts     # Hybrid Inference execution & Chrome Gemini Nano warmup
    │   └── pii.ts           # Client-side PII redaction engine
    ├── hooks/
    │   ├── useHistorySync.ts
    │   ├── useOnlineStatus.ts
    │   └── useRemoteModels.ts
    └── components/
        ├── AuthModal.tsx
        ├── HybridStatusBadge.tsx
        ├── RoutingInspector.tsx
        └── WorkspacePanel.tsx
```

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase:**
   Copy `.env.example` to `.env` and fill in your Firebase Web App credentials:
   ```bash
   cp .env.example .env
   ```
   - Enable **Firebase AI Logic (Gemini Developer API)** in the Firebase Console.
   - Enable **App Check** (debug mode is pre-enabled with `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN=true` for local development and hackathon judging; register the printed debug token in Firebase Console -> App Check -> Apps -> Manage debug tokens).
   - Enable **Authentication** (Google & Anonymous), **Firestore Database**, and **Remote Config**.

3. **Run locally:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## License

Licensed under the [Apache License, Version 2.0](./LICENSE).
