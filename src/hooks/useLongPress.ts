import { useRef, type PointerEvent } from "react";

/**
 * Long-press detection for touch. Fires after `ms` of a steady press;
 * any significant movement (scrolling) cancels it. Mouse is ignored —
 * desktop has hover affordances instead.
 */
export function useLongPress(onLongPress: () => void, ms = 420) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef({ x: 0, y: 0 });

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  return {
    onPointerDown: (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      origin.current = { x: e.clientX, y: e.clientY };
      clear();
      timer.current = setTimeout(onLongPress, ms);
    },
    onPointerMove: (e: PointerEvent) => {
      if (!timer.current) return;
      const dx = e.clientX - origin.current.x;
      const dy = e.clientY - origin.current.y;
      if (dx * dx + dy * dy > 100) clear();
    },
    onPointerUp: clear,
    onPointerCancel: clear,
    onPointerLeave: clear,
  };
}
