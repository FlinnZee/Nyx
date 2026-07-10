<div align="center">

# 🌙 Nyx

**A fluid, futuristic messaging experience.**

Deep-ink canvas · drifting aurora · glassy motion · built to feel alive.

[**⬇ Download for Windows**](https://github.com/FlinnZee/Nyx/releases/latest) · [**Website**](https://flinnzee.github.io/Nyx/) · [Changelog](CHANGELOG.md) · [Roadmap](ROADMAP.md)

![Version](https://img.shields.io/badge/version-0.3.0-8b5cf6?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows-3ce7ff?style=flat-square)
![Mobile](https://img.shields.io/badge/mobile-coming%20soon-ff5fa2?style=flat-square)
![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-0f0f1c?style=flat-square)

</div>

---

Nyx is a cross-platform messaging app. This repository is the **desktop build** (Windows-first),
built so the same UI codebase can ship to iOS and Android later. The interface leans on the
*Midnight Aurora* theme — a near-black surface lit by slow-moving teal → violet → magenta light,
frosted glass panels, and spring-driven micro-interactions everywhere.

## Features

- Real messaging over the network with sent / delivered / seen ticks, live typing indicators and presence
- Private by design — people are found only by exact @handle, connected through friend requests, and joined by invite code
- Device-side media: photos, files and voice notes live on your devices; the server only relays them and forgets
- Group chats with member lists and per-author message colours
- Voice & video calls (WebRTC) — full-screen call experience with mute, camera/speaker toggles and call timer
- Voice notes with live waveform recording, in-app camera capture, emoji picker, reactions
- Profile photos, status, bio and presence — synced to your circle
- System notifications when messages arrive, and a tray icon so Nyx keeps running quietly
- Three complete experiences: Midnight Aurora, Vortex (neon cyber) and Bloom (pastel glow)
- Custom frameless window, animated launch splash, and section-to-section transitions

## Make it yours

- **About page:** edit `src/data/creator.ts` (name, role, tagline, social links) and drop a
  square portrait at `public/creator.jpg` to show your photo.
- **Theme:** five accent auroras live in Settings → Appearance.
- **Roadmap:** see [ROADMAP.md](ROADMAP.md) for the plan to networking, calls, auto-updates and mobile.

## Building the installer

```bash
npm run app:build
```

Produces a Windows installer at `src-tauri/target/release/bundle/nsis/Nyx_0.1.0_x64-setup.exe`.
It's unsigned, so Windows SmartScreen shows an "unknown publisher" notice — click
**More info → Run anyway**. Code signing is on the roadmap.

## Stack

| Layer | Choice |
| --- | --- |
| App shell | Tauri v2 (Rust) — native window, tiny binary, mobile-ready |
| UI | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 with a custom design-token theme |
| Motion | Motion (Framer Motion) + CSS aurora shaders |
| State | Zustand |
| Icons / Type | Lucide · Space Grotesk / Inter (self-hosted) |

## Getting started

```bash
npm install          # install dependencies
npm run app:dev      # run the desktop app (Tauri + Vite dev server)
npm run dev          # run just the web frontend in a browser
npm run app:build    # produce a native desktop bundle
```

Requires Node, Rust (stable) and, on Windows, the WebView2 runtime (bundled with Windows 11).

## Structure

```
src/
  components/
    AuroraBackground.tsx   living backdrop + cursor glow
    TitleBar.tsx           custom frameless window chrome
    NyxLogo.tsx            the crescent mark
    Splash.tsx             animated launch screen
    sidebar/               app rail + conversation list
    chat/                  header, messages, bubbles, composer, voice, emoji
    calls/                 call history + full-screen call overlay
    people/                contacts directory
    profile/               editable profile
    settings/              appearance, notifications, privacy, chat, about
    ui/                    avatar, buttons, toggle, modal, segmented, toast
  hooks/useVoiceRecorder.ts   mic capture with graceful fallback
  store/                   chat, calls, ui and settings state
  lib/                     theming, formatting, helpers
  data/mock.ts             seed content
src-tauri/                 Rust shell, window + permission config
```

The client experience is complete and fully explorable offline; it runs on a local seeded
dataset with a simulated peer. The next milestone is the network transport — accounts,
message sync and delivery — after which the same UI ships to mobile via Tauri v2.

## Install (friends & testers)

1. Grab the latest `Nyx_x64-setup.exe` from [Releases](https://github.com/FlinnZee/Nyx/releases/latest).
2. Windows SmartScreen will warn because the build is not yet code-signed —
   click **More info → Run anyway**.
3. Create your account, confirm your email, and enter the **invite code** a
   Nyx member gave you. Add friends by their exact **@handle**.

## What's next

- 📱 **Mobile versions** — iOS & Android from the same core, already on the bench
- 🔊 Call relay (TURN) so calls connect on every network
- 🔄 Built-in auto-updates

See [ROADMAP.md](ROADMAP.md) for the full plan.

## License

**© 2026 TK NiRMAL (dr.v0id). All rights reserved.** This code is published
for viewing only — see [LICENSE](LICENSE). No use, copying, modification, or
redistribution is permitted.

---

<div align="center">

Designed, built & maintained by **TK NiRMAL (dr.v0id)**

</div>
