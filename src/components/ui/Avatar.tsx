import { useState } from "react";
import type { Presence } from "../../types";
import { avatarGradient, initials } from "../../lib/format";
import { cn } from "../../lib/cn";

const presenceColor: Record<Presence, string> = {
  online: "var(--color-online)",
  away: "var(--color-away)",
  offline: "var(--color-faint)",
};

export default function Avatar({
  name,
  hue,
  presence,
  src,
  size = 44,
  showPresence = true,
}: {
  name: string;
  hue: number;
  presence?: Presence;
  src?: string;
  size?: number;
  showPresence?: boolean;
}) {
  const dot = Math.max(9, Math.round(size * 0.26));
  const [broken, setBroken] = useState(false);
  const showImg = !!src && !broken;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {showImg ? (
        <img
          src={src}
          alt={name}
          onError={() => setBroken(true)}
          className="h-full w-full rounded-full object-cover"
          style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.35)" }}
        />
      ) : (
        <div
          className="grid h-full w-full place-items-center rounded-full font-display font-semibold text-white/95"
          style={{
            background: avatarGradient(hue),
            fontSize: size * 0.36,
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.35)",
          }}
        >
          {initials(name)}
        </div>
      )}

      {showPresence && presence && (
        <span
          className="absolute bottom-0 right-0 grid place-items-center rounded-full"
          style={{ width: dot, height: dot, background: "var(--color-ink)" }}
        >
          <span
            className={cn(
              "relative rounded-full",
              presence === "online" && "shadow-[0_0_8px_var(--color-online)]",
            )}
            style={{
              width: dot * 0.62,
              height: dot * 0.62,
              background: presenceColor[presence],
            }}
          >
            {presence === "online" && (
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  background: presenceColor[presence],
                  animation: "pulse-ring 2.4s ease-out infinite",
                }}
              />
            )}
          </span>
        </span>
      )}
    </div>
  );
}
