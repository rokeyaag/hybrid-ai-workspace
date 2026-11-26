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
- **Firebase Remote Config, Auth & Firestore:** Remote Config dynamically manages the default inference mode, fallback model name (`gemini-3.5-flash-lite`), and PII shield defaults; Firebase Auth (Google & Anonymous) secures per-user Firestore collections via `firestore.rules`.

#### Challenges we ran into
- **Deprecated Cloud Fallback Model & App Check Enforcement:** Early during testing, `gemini-2.5-flash-lite` returned `404` for new projects, and Firebase Hosting's live `.web.app` domain rejected localhost App Check debug tokens (`401`). We upgraded the fallback model to `gemini-3.5-flash-lite` via Remote Config defaults and implemented automatic hostname-aware App Check routing (`ReCaptchaEnterpriseProvider` via Google Cloud Fraud Defense in production, debug tokens on `localhost`).
- **On-Device Browser Variance:** Not every desktop browser exposes Chrome's Built-in AI (`LanguageModel`) API, so testing both strict local failure modes and seamless cloud fallback was essential to verify consistent UX across browsers.

#### Accomplishments that we're proud of
- Zero-server hybrid AI architecture using a single `firebase/ai` SDK across offline local storage, on-device Gemini Nano, and Cloud Gemini fallback.
- Real-time **Hybrid Routing Inspector** that proves `inferenceSource` (`on_device` vs `in_cloud`), latency, and local PII scrubbing live in the UI.
- Full production deployment on Firebase Hosting protected by Google Cloud Fraud Defense (App Check) and per-user Firestore rules.

#### What we learned
- Designing around `InferenceMode.PREFER_ON_DEVICE` requires treating connectivity and local model availability as first-class UI states (`LanguageModel.availability()`, `initializeDeviceModel()`, and offline persistence).
- Enforcing Firebase App Check with Google Cloud Fraud Defense protects client-side Gemini endpoints cleanly without managing a custom API proxy.

#### What's next for Hybrid AI Workspace
- Multi-note RAG retrieval combining local embeddings with Cloud Gemini long-context synthesis.
- Mobile companion builds (Android Gemini Nano & iOS Apple Foundation Models) syncing to the same Firestore workspace.

---

## 3. YouTube Upload Details (Copy-Paste)

- **Title:** `Hybrid AI Workspace — On-Device Gemini Nano & Cloud Fallback (#BuildHybridAI 2026)`
- **Visibility:** `Public`
- **Subtitles File:** Upload `demo/subtitles.srt` in YouTube Studio
- **Description:**
```text
Hybrid AI Workspace — Built for #BuildHybridAI 2026 (Google Firebase Hackathon)

A privacy-first, offline-capable AI knowledge workspace powered by Firebase AI Logic Hybrid Inference:
• Runs prompts on-device with Chrome Gemini Nano (InferenceMode.PREFER_ON_DEVICE)
• Automatically falls back to Cloud Gemini 3.5 Flash Lite when unavailable
• Local PII Privacy Shield scrubs emails, phone numbers, cards & API keys before leaving the browser
• Protected by Firebase App Check (Google Cloud Fraud Defense), Firebase Auth, Cloud Firestore & Remote Config

Live Demo: https://build-hybrid-ai-2026-df4d2.web.app
GitHub (Apache 2.0): https://github.com/rokeyaag/hybrid-ai-workspace
```
- **Tags:** `Firebase, Firebase AI Logic, Gemini Nano, BuildHybridAI, Hybrid Inference, App Check, Google AI, React, TypeScript`

---

## 4. Devpost Form Field Checklist

- **Project Name:** `Hybrid AI Workspace`
- **Elevator Pitch / Tagline:** `Privacy-first, offline-capable AI workspace powered by Firebase AI Logic Hybrid Inference (Gemini Nano on-device + Cloud Gemini fallback).`
- **Platform:** `Web`
- **Built With:** `firebase`, `firebase-ai-logic`, `gemini-nano`, `gemini`, `app-check`, `firestore`, `firebase-auth`, `remote-config`, `react`, `typescript`, `vite`
- **Try it out / Live URL:** `https://build-hybrid-ai-2026-df4d2.web.app`
- **GitHub Repository:** `https://github.com/rokeyaag/hybrid-ai-workspace`
- **Image Gallery:** Upload the 6 screenshots from `demo/screenshots/`
- **Video Demo Link:** `https://youtu.be/SY2HtK2uOx4`
