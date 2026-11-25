# #BuildHybridAI 2026 — Submission & Demo Guide

## 1. 3-Minute YouTube Demo Script (English)

> Keep total video length **under 3 minutes** (Devpost evaluates only the first 3 minutes). Upload publicly to YouTube in English or with English subtitles.

### `[0:00 – 0:25]` Problem & Solution Intro
- **Visual:** Show the Hybrid AI Workspace live UI (`https://build-hybrid-ai-2026-df4d2.web.app` or Chrome desktop).
- **Script:**
  > "Hi! I'm Lutfor, and this is **Hybrid AI Workspace**, built for **#BuildHybridAI 2026** using **Firebase AI Logic Hybrid Inference**. Modern AI workspaces face a tradeoff: cloud models leak sensitive data, add latency, and fail offline, while on-device models aren't available on every browser. Hybrid AI Workspace solves both using a single Firebase AI Logic SDK."

### `[0:25 – 1:10]` On-Device & Offline Execution (Chrome Gemini Nano)
- **Visual:** Open in Chrome Desktop (v139+ with Built-in AI enabled), show `Chrome Gemini Nano: available` in the **Hybrid Routing Inspector**. Toggle Wi-Fi/Network offline in DevTools (`Offline Mode (Local AI Ready)` banner appears). Click **Summarize** or **Action Items**.
- **Script:**
  > "When running on a supported Chrome desktop, Firebase AI Logic routes prompts locally to Gemini Nano using `InferenceMode.PREFER_ON_DEVICE`. Even when I disconnect from the internet, clicking Summarize runs instantaneously on-device with zero cloud cost—and the Routing Inspector confirms `inferenceSource: on_device`."

### `[1:10 – 1:55]` Local PII Shield + Automatic Cloud Fallback
- **Visual:** Switch to a browser/device without Gemini Nano (`unavailable`) or select `Prefer Cloud`. Highlight the sample note containing `dev@example.com` and `+1 (555) 234-5678` with **Local PII Shield** checked. Click **Summarize**.
- **Script:**
  > "When on-device Gemini Nano isn't available, Firebase AI Logic automatically falls back to Cloud Gemini (`gemini-3.5-flash-lite`), protected by **Firebase App Check**. Before the prompt leaves the browser, our **Local PII Shield** scrubs emails, phone numbers, API tokens, and card numbers locally—here you can see `2 PII scrubbed locally` and `Cloud Fallback (Gemini)` verified in the telemetry log."

### `[1:55 – 2:35]` Full Firebase Stack (App Check, Remote Config, Auth, Firestore)
- **Visual:** Show the **Hybrid Routing Inspector** (`App Check`, `Remote Config: Synced`), click **Sign In** (Google / Anonymous Auth), create/edit a note showing Firestore sync. Briefly flash `src/lib/hybrid-ai.ts` and `src/lib/firebase.ts`.
- **Script:**
  > "Under the hood, we integrate five Firebase products: **Firebase AI Logic** for hybrid routing and `initializeDeviceModel` warmup, **App Check** to protect cloud endpoints, **Remote Config** to dynamically switch cloud fallback models without redeploying, **Firebase Auth**, and **Cloud Firestore** for offline-first cross-device sync."

### `[2:35 – 3:00]` Closing
- **Visual:** Show GitHub repository (`https://github.com/rokeyaag/hybrid-ai-workspace`) with Apache 2.0 License and live app URL.
- **Script:**
  > "Hybrid AI Workspace is open-source under the Apache 2.0 license and live on Firebase Hosting. Thanks for watching!"

---

## 2. Devpost Submission Copy (Ready to Paste)

- **Project Name:** `Hybrid AI Workspace`
- **Tagline:** `Privacy-first, offline-capable AI workspace powered by Firebase AI Logic Hybrid Inference (Gemini Nano on-device + Cloud Gemini fallback).`
- **Built With:** `firebase`, `firebase-ai-logic`, `gemini-nano`, `gemini`, `app-check`, `firestore`, `firebase-auth`, `remote-config`, `react`, `typescript`, `vite`
- **Repository URL:** `https://github.com/rokeyaag/hybrid-ai-workspace`
- **Live URL:** `https://build-hybrid-ai-2026-df4d2.web.app`

### About the Project (Markdown for Devpost)

#### Inspiration
Teams and individuals want AI assistance inside their notes and documents, but sending every draft to the cloud introduces latency, API costs, offline failures, and privacy exposure for sensitive data. With **Firebase AI Logic Hybrid Inference**, we saw the opportunity to build a workspace that defaults to fast, free, private on-device execution and transparently falls back to Cloud Gemini when needed.

#### What it does
- **Smart Hybrid Inference (`PREFER_ON_DEVICE`):** Summarizes notes, extracts action items, rewrites drafts, performs privacy audits, and answers contextual questions using on-device Gemini Nano when supported and Cloud Gemini (`gemini-3.5-flash-lite`) as seamless fallback.
- **Local PII Privacy Shield:** Automatically detects and redacts emails, phone numbers, credit cards, SSNs, and API keys locally in the browser before any prompt can reach the cloud.
- **Live Hybrid Routing Inspector:** Surfaces real-time `result.response.inferenceSource` (`on_device` vs `in_cloud`), latency in milliseconds, PII scrubbed count, Chrome `LanguageModel.availability()`, and `initializeDeviceModel()` warmup progress.
- **Offline-First Persistence & Cloud Sync:** Saves notes and telemetry locally in `localStorage` for instant offline operation and syncs with **Cloud Firestore** when authenticated via **Firebase Authentication**.

#### How we built it
- **Frontend:** React 19, TypeScript, Vite, and custom dark-mode UI components.
- **Firebase AI Logic (`firebase/ai`):** `getAI` with `GoogleAIBackend`, `getGenerativeModel` configured with `InferenceMode` (`PREFER_ON_DEVICE`, `ONLY_ON_DEVICE`, `PREFER_IN_CLOUD`, `ONLY_IN_CLOUD`), `inCloudParams`, and `initializeDeviceModel`.
- **Firebase App Check:** Enforces attestation on AI calls (`ReCaptchaV3Provider` / `ReCaptchaEnterpriseProvider` and `FIREBASE_APPCHECK_DEBUG_TOKEN` support).
- **Firebase Remote Config, Auth & Firestore:** Remote Config dynamically manages the default inference mode, fallback model name, and PII shield defaults; Firebase Auth (Google & Anonymous) secures per-user Firestore collections via `firestore.rules`.
