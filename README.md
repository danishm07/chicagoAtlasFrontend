# Chicago Atlas - Mobile Client

Loop Pulse is a real-time, context-aware city intelligence platform for Chicago. This repository contains the mobile client, built to deliver low-latency AI interactions, real-time data visualizations, and high-fidelity native APIs (haptics, audio streaming).

## 🚀 Tech Stack & Technical Specs
* **Framework:** React Native / Expo (SDK 50+)
* **Language:** TypeScript
* **Styling:** React Native StyleSheet & Context API for dynamic theming
* **Native Modules:** `expo-av` (Audio playback/recording), `expo-file-system` (Caching), `expo-haptics` (Tactile feedback)

## 🧠 Core Features
* **Harold (Conversational AI):** Siri-style voice and text assistant. Features push-to-talk recording, real-time Markdown rendering, and dynamic source attribution chips.
* **Perplexity-Style Maps:** Parses AI responses to generate rich, native Google Maps cards using `Linking` for deep-linking into the native OS map application.
* **Signals Dashboard:** A high-fidelity "Blueprint" grid utilizing the `Animated` API for radar pulses, avoiding the overhead and instability of heavy third-party map SDKs.
* **Live Transit & CPD Drawer:** Real-time integration of CTA Train ETAs and Official Chicago Police Department (CPD) incident data, cleanly segmented from crowdsourced community reports.

## 🛠 Why We Chose This Stack
* **Expo & React Native:** Chosen for rapid cross-platform compilation and the ability to instantly tap into device hardware (Microphone, Haptics) without writing custom Swift/Kotlin bridges. 
* **Pre-download Audio Strategy:** Instead of attempting to stream raw HTTP audio chunks (which causes `-1008` iOS player crashes on spotty hackathon Wi-Fi), the app uses `expo-file-system` to download the TTS payload to a temporary cache before playback, ensuring 100% stability during demos.
* **AI-Assisted Development:** The frontend architecture, state management, and complex `Animated` native driver loops were scaffolded and refined utilizing **Gemini** for structural problem-solving and **Windsurf/GitHub Copilot** for rapid inline component generation.

## ⚙️ Local Setup
1. Clone the repository and run `npm install`
2. Configure `.env.local` with the required API keys (e.g., Azure Maps static tile key if applicable).
3. Run `npx expo start` and scan the QR code using the Expo Go app.
