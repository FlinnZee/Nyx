import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Phone,
  Video,
  MoreHorizontal,
  Pin,
  BellOff,
  Bell,
  UserRound,
  Users,
} from "lucide-react";
import type { Contact, Conversation, Presence } from "../../types";
import Avatar from "../ui/Avatar";
import IconButton from "../ui/IconButton";
import Modal from "../ui/Modal";
import { useCallStore } from "../../store/useCallStore";
import { useChatStore } from "../../store/useChatStore";
import { useUIStore } from "../../store/useUIStore";
import { avatarGradient } from "../../lib/format";

const presenceLabel: Record<Presence, string> = {
  online: "Active now",
  away: "Away",
  offline: "Offline",
};

export default function ChatHeader({
  contact,
  conversation,
  typing,
}: {
  contact?: Contact;
  conversation: Conversation;
  typing: boolean;
}) {
  const startCall = useCallStore((s) => s.start);
  const togglePin = useChatStore((s) => s.togglePin);
  const toggleMute = useChatStore((s) => s.toggleMute);
  const contacts = useChatStore((s) => s.contacts);
  const showToast = useUIStore((s) => s.showToast);
  const [menu, setMenu] = useState(false);
  const [details, setDetails] = useState(false);

  const isGroup = !!conversation.isGroup;
  const title = isGroup ? (conversation.title ?? "Group") : (contact?.name ?? "Chat");
  const memberCount = conversation.memberIds?.length ?? 0;

  return (
    <header className="relative flex h-[68px] shrink-0 items-center gap-3 border-b border-line px-6">
      <button
        type="button"
        onClick={() => setDetails(true)}
        className="flex min-w-0 items-center gap-3 rounded-xl py-1 pr-2 text-left transition-colors hover:bg-white/[0.03]"
      >
        {isGroup ? (
          <div
            className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full text-white"
            style={{ background: avatarGradient((title.length * 47) % 360) }}
          >
            <Users size={19} />
          </div>
        ) : (
          <Avatar
            name={contact!.name}
            hue={contact!.hue}
            presence={contact!.presence}
            src={contact!.avatarUrl}
            size={42}
          />
        )}
        <div className="min-w-0">
          <div className="truncate font-display text-[16px] font-semibold">{title}</div>
          <div className="h-4 text-[12px]">
            <AnimatePresence mode="wait" initial={false}>
              {typing ? (
                <motion.span
                  key="t"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-accent"
                >
                  typing…
                </motion.span>
              ) : (
                <motion.span
                  key="p"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-muted"
                >
                  {isGroup ? `${memberCount} members` : presenceLabel[contact!.presence]}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </button>

      <div className="ml-auto flex items-center gap-1">
        {!isGroup && contact && (
          <>
            <IconButton title="Voice call" size={38} onClick={() => startCall(contact.id, "voice")}>
              <Phone size={18} />
            </IconButton>
            <IconButton title="Video call" size={38} onClick={() => startCall(contact.id, "video")}>
              <Video size={18} />
            </IconButton>
          </>
        )}
        <IconButton title="More" size={38} active={menu} onClick={() => setMenu((v) => !v)}>
          <MoreHorizontal size={18} />
        </IconButton>
      </div>

      <AnimatePresence>
        {menu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="glass-panel absolute right-6 top-[60px] z-20 w-52 rounded-2xl p-1.5"
            >
              <MenuRow
                icon={<Pin size={16} />}
                label={conversation.pinned ? "Unpin chat" : "Pin chat"}
                onClick={() => {
                  togglePin(conversation.id);
                  showToast(conversation.pinned ? "Chat unpinned" : "Chat pinned");
                  setMenu(false);
                }}
              />
              <MenuRow
                icon={conversation.muted ? <Bell size={16} /> : <BellOff size={16} />}
                label={conversation.muted ? "Unmute" : "Mute"}
                onClick={() => {
                  toggleMute(conversation.id);
                  showToast(conversation.muted ? "Notifications on" : "Chat muted");
                  setMenu(false);
                }}
              />
              <MenuRow
                icon={<UserRound size={16} />}
                label={isGroup ? "Group details" : "View profile"}
                onClick={() => {
                  setDetails(true);
                  setMenu(false);
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Modal open={details} onClose={() => setDetails(false)} width={380}>
        {isGroup ? (
          <div className="flex flex-col items-center text-center">
            <div
              className="grid h-[92px] w-[92px] place-items-center rounded-full text-white"
              style={{ background: avatarGradient((title.length * 47) % 360) }}
            >
              <Users size={38} />
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold">{title}</h2>
            <p className="text-sm text-muted">{memberCount} members</p>
            <div className="mt-4 w-full space-y-1 text-left">
              {(conversation.memberIds ?? []).map((id) => {
                const m = contacts[id];
                return (
                  <div key={id} className="flex items-center gap-3 rounded-xl px-3 py-2">
                    <Avatar
                      name={m?.name ?? "Member"}
                      hue={m?.hue ?? 200}
                      src={m?.avatarUrl}
                      size={34}
                      showPresence={false}
                    />
                    <span className="truncate text-sm text-text">{m?.name ?? "You"}</span>
                    <span className="ml-auto truncate text-[12px] text-faint">{m?.handle}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          contact && (
            <div className="flex flex-col items-center text-center">
              <Avatar
                name={contact.name}
                hue={contact.hue}
                presence={contact.presence}
                src={contact.avatarUrl}
                size={92}
              />
              <h2 className="mt-4 font-display text-xl font-semibold">{contact.name}</h2>
              <p className="text-sm text-muted">{contact.handle}</p>
              {contact.bio && <p className="mt-3 max-w-xs text-sm text-muted">{contact.bio}</p>}
              <div className="mt-5 flex gap-3">
                <IconButton
                  title="Voice call"
                  variant="outline"
                  onClick={() => {
                    startCall(contact.id, "voice");
                    setDetails(false);
                  }}
                >
                  <Phone size={18} />
                </IconButton>
                <IconButton
                  title="Video call"
                  variant="outline"
                  onClick={() => {
                    startCall(contact.id, "video");
                    setDetails(false);
                  }}
                >
                  <Video size={18} />
                </IconButton>
              </div>
            </div>
          )
        )}
      </Modal>
    </header>
  );
}

function MenuRow({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-white/[0.06] hover:text-text"
    >
      {icon}
      {label}
    </button>
  );
}
