# Changelog

All notable changes to Nyx.

## 0.3.1 · 2026-07-10

### Added
- Reply to a specific message, with a quoted preview
- Forward messages to one or more chats
- Delete for me & delete for everyone
- Persistent call history (survives restarts) with missed / declined states
- In-app "update available" banner so you always know when a new build ships

### Fixed
- Call list no longer resets when the app restarts
- Clearer errors when a mic/camera is blocked, missing or busy; calls now time out on no-answer

## 0.3.0 — Private Circles · 2026-07-10

The first public release.

### Added
- Real sent / delivered / seen receipts on every message
- Friend system: exact-@handle search, requests, accept/decline — no public directory
- In-app one-time invite code generation (Nyx is invite-only)
- Group chats with member lists and per-author colours
- Device-side media: photos, files & voice notes live on your devices; the server
  only relays them and forgets after delivery
- Profile photos, synced to your circle
- System notifications for new messages; tray icon with close-to-tray
- Three complete experiences: **Midnight Aurora**, **Vortex**, **Bloom**
- Friendlier sign-up flow with clear email-confirmation guidance

### Fixed
- Logo mark now renders correctly everywhere (rebuilt crescent geometry)
- Opening a chat from People lands inside that chat
- Startup crash on fresh accounts

## 0.2.x — Connected · 2026-07-09
- Live messaging, presence and typing indicators over the network
- Voice & video calls (WebRTC) with in-call controls
- Invite-gated accounts

## 0.1.0 — First Light · 2026-07-09
- Midnight Aurora interface: chats, voice notes, file sharing, emoji, reactions
- Custom frameless window, animated splash, call experience
