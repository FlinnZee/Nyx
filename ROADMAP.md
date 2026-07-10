# Nyx — path from demo to a real app you use with friends

This is the plan for taking Nyx from the current **local client** to something you and your
friends actually message on, then to mobile. Written for the first release (v0.1.0).

---

## Where it is right now (v0.1.0)

- A complete, beautiful **client** — chats, voice notes, photos/files, camera capture,
  voice/video calls, reactions, profile, settings.
- Everything runs **locally** against seeded data with a simulated peer. Camera and mic work
  in the packaged app. There is **no network yet**, so two installs can't talk to each other.
- Distributable as a Windows `setup.exe`.

So today you can hand a friend the installer and they can *experience* Nyx — but real
device-to-device messaging is the next milestone.

---

## Step 1 — Share the first build (do this now)

- Give friends `Nyx_0.1.0_x64-setup.exe` (from `src-tauri/target/release/bundle/nsis/`).
- It's **unsigned**, so Windows SmartScreen shows "unknown publisher." They click
  **More info → Run anyway.** That's expected for an indie build.
- To remove that warning later: an OV code-signing certificate (~$100–200/yr) or
  **Azure Trusted Signing** (cheap). Optional for a friends test.
- Where to host it: **GitHub Releases** on a private repo (invite friends as collaborators),
  your own website, or any file host.

## Step 2 — Add the transport (makes it a real messenger)

Pick one backend. Recommendation for a fast friends test: **Supabase**.

- **Supabase (recommended first):** Postgres + Realtime + Auth + Storage, generous free tier.
  - Auth: email OTP, or a simple **invite-code** flow for a closed friends group.
  - Messages: a `messages` table + Realtime subscriptions → instant delivery/typing/presence.
  - Files/voice/photos: Supabase Storage buckets (swap the local object URLs for uploads).
  - Minimal ops, no server to run.
- **Self-hosted server (more control/ownership):** a small **Rust (axum) or Node/Bun**
  WebSocket service + SQLite/Postgres on a $5 VPS (Fly.io, Railway, Render). More work,
  full ownership of data.

Wire the existing Zustand stores to the backend: replace the mock `deliver()` reply with real
send/receive, and hydrate conversations/messages from the server.

## Step 3 — Real calls (WebRTC)

- The webview already has the WebRTC APIs. Add **signaling** over the same channel
  (Supabase Realtime or your WS server) to exchange SDP/ICE.
- Use Google's free **STUN**; add a **TURN** server for friends behind strict NATs
  (Metered/Twilio, or self-host `coturn`).
- The call UI is already built — it just needs the peer connection behind it.

## Step 4 — Painless updates (the "future updatable" part)

- Enable the **Tauri updater plugin**. Host `latest.json` + signed artifacts on
  GitHub Releases or your server.
- The app checks on launch and updates itself — so friends never re-download an installer.
- Generate updater signing keys once and keep them safe.

## Step 5 — Mobile (same codebase) ✅ Android · 🌐 Web · 🍎 iOS pending

- ✅ **Android APK** ships from this repo (`npx tauri android build --apk --target aarch64`;
  toolchain lives in `D:\.dev\tools`, signing keystore is local-only).
- ✅ **Nyx Web** — the same app served at `/app/` on the website; on iPhone use
  Safari → Add to Home Screen. Messaging & calls work in the browser.
- ✅ Touch-first layout, floating dock navigation, haptics, device-link QR.
- 🍎 **Native iOS** requires a Mac with Xcode (+ Apple Developer account to
  distribute). When Mac access exists: `npm run tauri ios init` — the codebase
  is already mobile-ready.
- Later: Play Store listing ($25 one-time), FCM push while the app is closed,
  address-book sync (needs a small native plugin).

---

## Suggested order

1. Ship v0.1.0 `setup.exe` to friends (now). ✅
2. Supabase transport → real 1:1 and group messaging.
3. WebRTC calls + TURN.
4. Tauri updater for auto-updates.
5. Android build, then iOS.

---

Nyx — designed & developed by **TK NiRMAL (dr.v0id)**.
