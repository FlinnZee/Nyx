import { useEffect, useState, type ReactNode } from "react";
import { Minus, Square, Copy, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import NyxLogo from "./NyxLogo";

const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const appWindow = isTauri ? getCurrentWindow() : null;

export default function TitleBar() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!appWindow) return;
    appWindow.isMaximized().then(setMaximized).catch(() => {});
    const unlisten = appWindow.onResized(() => {
      appWindow.isMaximized().then(setMaximized).catch(() => {});
    });
    return () => {
      unlisten.then((f) => f()).catch(() => {});
    };
  }, []);

  return (
    <header
      data-tauri-drag-region
      className="relative z-30 flex h-11 shrink-0 items-center justify-between border-b border-line px-4 select-none"
    >
      <div
        data-tauri-drag-region
        className="flex items-center gap-2.5 pointer-events-none"
      >
        <NyxLogo size={22} />
        <span className="font-display text-[15px] font-semibold tracking-wide">
          Nyx
        </span>
      </div>

      <div className="flex items-center gap-1">
        <WinButton
          label="Minimize"
          onClick={() => appWindow?.minimize()}
        >
          <Minus size={15} />
        </WinButton>
        <WinButton
          label="Maximize"
          onClick={() => appWindow?.toggleMaximize()}
        >
          {maximized ? <Copy size={13} /> : <Square size={12.5} />}
        </WinButton>
        <WinButton
          label="Close"
          danger
          onClick={() => appWindow?.close()}
        >
          <X size={15} />
        </WinButton>
      </div>
    </header>
  );
}

function WinButton({
  children,
  onClick,
  label,
  danger,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={
        "flex h-7 w-8 items-center justify-center rounded-md text-muted transition-colors duration-150 " +
        (danger
          ? "hover:bg-red-500/80 hover:text-white"
          : "hover:bg-white/10 hover:text-text")
      }
    >
      {children}
    </button>
  );
}
