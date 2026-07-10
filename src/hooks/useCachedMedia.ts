import { useEffect, useState } from "react";
import type { Message } from "../types";
import { getMediaUrl } from "../lib/mediaCache";

/**
 * Resolve a message's media source: this device's local store first, then the
 * transient server URL. Null while loading; empty string when the media only
 * exists on the device it was originally sent or received on.
 */
export function useCachedMedia(message: Message): string | null {
  const remote = message.attachment?.url ?? message.voice?.url ?? "";
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getMediaUrl(message.id).then((local) => {
      if (alive) setSrc(local ?? remote);
    });
    return () => {
      alive = false;
    };
  }, [message.id, remote]);

  return src;
}
