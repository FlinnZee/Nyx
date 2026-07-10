import { useEffect } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import AuroraBackground from "./components/AuroraBackground";
import TitleBar from "./components/TitleBar";
import AppRail from "./components/sidebar/AppRail";
import ConversationList from "./components/sidebar/ConversationList";
import ChatView from "./components/chat/ChatView";
import CallsScreen from "./components/calls/CallsScreen";
import PeopleScreen from "./components/people/PeopleScreen";
import SettingsScreen from "./components/settings/SettingsScreen";
import ProfileScreen from "./components/profile/ProfileScreen";
import CallOverlay from "./components/calls/CallOverlay";
import Splash from "./components/Splash";
import Toast from "./components/ui/Toast";
import UpdateBanner from "./components/UpdateBanner";
import AuthScreen from "./components/auth/AuthScreen";
import InviteGate from "./components/auth/InviteGate";
import AuthLoading from "./components/auth/AuthLoading";
import BottomBar from "./components/sidebar/BottomBar";
import { useUIStore } from "./store/useUIStore";
import { useSettingsStore } from "./store/useSettingsStore";
import { useAuthStore } from "./store/useAuthStore";
import { useChatStore } from "./store/useChatStore";
import { useCallStore } from "./store/useCallStore";
import { useIsMobile } from "./hooks/useIsMobile";
import { applyTheme } from "./lib/theme";
import { initNotifications } from "./lib/notify";
import { isSupabaseConfigured } from "./lib/supabase";

function ChatsSection({ mobile }: { mobile: boolean }) {
  const mobileView = useUIStore((s) => s.mobileView);
  if (!mobile) {
    return (
      <>
        <ConversationList />
        <ChatView />
      </>
    );
  }
  // Phone: stacked navigation — the list, or the open chat, never both.
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {mobileView === "list" ? (
        <motion.div
          key="list"
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          className="flex min-h-0 flex-1"
        >
          <ConversationList />
        </motion.div>
      ) : (
        <motion.div
          key="chat"
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          className="flex min-h-0 flex-1"
        >
          <ChatView />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SectionView({ mobile }: { mobile: boolean }) {
  const section = useUIStore((s) => s.section);
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={section}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2 }}
        className="flex min-h-0 flex-1"
      >
        {section === "chats" && <ChatsSection mobile={mobile} />}
        {section === "calls" && <CallsScreen />}
        {section === "people" && <PeopleScreen />}
        {section === "settings" && <SettingsScreen />}
        {section === "profile" && <ProfileScreen />}
      </motion.div>
    </AnimatePresence>
  );
}

function AppShell() {
  const mobile = useIsMobile();
  const section = useUIStore((s) => s.section);
  const mobileView = useUIStore((s) => s.mobileView);
  // Hide the dock while inside a chat so the composer owns the bottom edge.
  const hideDock = mobile && section === "chats" && mobileView === "chat";

  if (!mobile) {
    return (
      <main className="flex min-h-0 flex-1">
        <AppRail />
        <SectionView mobile={false} />
      </main>
    );
  }
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1">
        <SectionView mobile />
      </div>
      {!hideDock && <BottomBar />}
    </main>
  );
}

function Gate() {
  const ready = useAuthStore((s) => s.ready);
  const session = useAuthStore((s) => s.session);
  const account = useAuthStore((s) => s.account);
  const demo = useAuthStore((s) => s.demo);

  if (isSupabaseConfigured && !demo) {
    if (!ready) return <AuthLoading />;
    if (!session) return <AuthScreen />;
    if (!account?.approved) return <InviteGate />;
  }
  return <AppShell />;
}

export default function App() {
  const accent = useSettingsStore((s) => s.prefs.accent);
  const theme = useSettingsStore((s) => s.prefs.theme);
  const reduceMotion = useSettingsStore((s) => s.prefs.reduceMotion);
  const splashDone = useUIStore((s) => s.splashDone);
  const init = useAuthStore((s) => s.init);
  const account = useAuthStore((s) => s.account);
  const myId = account?.approved ? account.id : null;
  const mobile = useIsMobile();

  useEffect(() => {
    applyTheme(theme, accent);
  }, [theme, accent]);

  useEffect(() => {
    init();
    initNotifications();
  }, [init]);

  useEffect(() => {
    if (!myId) return;
    useChatStore.getState().hydrate(myId);
    useCallStore.getState().initSignaling(myId);

    // Coming back to the window marks the open conversation as read.
    const onFocus = () => {
      const { activeId, markConversationRead } = useChatStore.getState();
      if (activeId) markConversationRead(activeId);
    };
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      useChatStore.getState().teardown();
      useCallStore.getState().teardownSignaling();
    };
  }, [myId]);

  return (
    <MotionConfig reducedMotion={reduceMotion ? "always" : "user"}>
      <div
        className="relative flex h-screen flex-col overflow-hidden text-text"
        style={mobile ? { paddingTop: "env(safe-area-inset-top)" } : undefined}
      >
        <AuroraBackground />
        {!mobile && <TitleBar />}
        <UpdateBanner />
        <Gate />
        <CallOverlay />
        <Toast />
        <AnimatePresence>{!splashDone && <Splash />}</AnimatePresence>
      </div>
    </MotionConfig>
  );
}
