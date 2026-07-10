import { useEffect } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "motion/react";
import { useSettingsStore } from "../store/useSettingsStore";

/**
 * The living backdrop of Nyx. Each experience gets its own scene:
 *  aurora — drifting light blooms over deep ink
 *  vortex — neon perspective grid, scanline, cyber orbs
 *  bloom  — floating pastel bokeh and twinkling dust
 * All share the cursor-trailing glow.
 */
export default function AuroraBackground() {
  const theme = useSettingsStore((s) => s.prefs.theme);

  const mx = useMotionValue(-1000);
  const my = useMotionValue(-1000);
  const x = useSpring(mx, { stiffness: 60, damping: 20, mass: 0.6 });
  const y = useSpring(my, { stiffness: 60, damping: 20, mass: 0.6 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX);
      my.set(e.clientY);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my]);

  const glow = useMotionTemplate`radial-gradient(560px circle at ${x}px ${y}px, color-mix(in srgb, var(--color-accent) 13%, transparent), transparent 62%)`;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink">
      {theme === "aurora" && <AuroraScene />}
      {theme === "vortex" && <VortexScene />}
      {theme === "bloom" && <BloomScene />}

      <motion.div className="absolute inset-0" style={{ background: glow }} />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 0%, transparent 55%, rgba(4,4,9,0.85) 100%)",
        }}
      />
    </div>
  );
}

function AuroraScene() {
  return (
    <>
      {/* Shooting stars */}
      {[{ top: "12%", right: "8%", dur: "9s", delay: "0s" }, { top: "30%", right: "-4%", dur: "13s", delay: "5s" }].map(
        (s, i) => (
          <span
            key={i}
            className="absolute h-[2px] w-32 origin-right rounded-full"
            style={{
              top: s.top,
              right: s.right,
              background: "linear-gradient(90deg, transparent, #eafcff)",
              boxShadow: "0 0 12px rgba(234,252,255,0.7)",
              animation: `shooting-star ${s.dur} ease-in ${s.delay} infinite`,
            }}
          />
        ),
      )}
      <div
        className="absolute -left-[15%] -top-[20%] h-[65vh] w-[65vh] rounded-full opacity-70 blur-[110px]"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.55), transparent 60%)",
          animation: "aurora-drift-a 22s ease-in-out infinite",
        }}
      />
      <div
        className="absolute right-[-10%] top-[8%] h-[55vh] w-[55vh] rounded-full opacity-60 blur-[120px]"
        style={{
          background: "radial-gradient(circle, rgba(60,231,255,0.40), transparent 60%)",
          animation: "aurora-drift-b 28s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-[-20%] left-[30%] h-[60vh] w-[60vh] rounded-full opacity-55 blur-[120px]"
        style={{
          background: "radial-gradient(circle, rgba(255,95,162,0.38), transparent 60%)",
          animation: "aurora-drift-c 25s ease-in-out infinite",
        }}
      />
    </>
  );
}

function VortexScene() {
  return (
    <>
      {/* Perspective neon grid floor */}
      <div
        className="absolute inset-x-[-30%] bottom-[-12%] h-[60vh]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,255,159,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,159,0.16) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
          transform: "perspective(480px) rotateX(62deg)",
          transformOrigin: "50% 100%",
          animation: "grid-scroll 1.6s linear infinite",
          maskImage: "linear-gradient(to top, #000 30%, transparent 95%)",
          WebkitMaskImage: "linear-gradient(to top, #000 30%, transparent 95%)",
        }}
      />
      {/* Cyber orbs */}
      <div
        className="absolute -left-[10%] top-[-15%] h-[55vh] w-[55vh] rounded-full opacity-50 blur-[110px]"
        style={{
          background: "radial-gradient(circle, rgba(0,255,159,0.45), transparent 60%)",
          animation: "aurora-drift-a 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute right-[-12%] top-[20%] h-[50vh] w-[50vh] rounded-full opacity-40 blur-[120px]"
        style={{
          background: "radial-gradient(circle, rgba(0,207,255,0.4), transparent 60%)",
          animation: "aurora-drift-b 24s ease-in-out infinite",
        }}
      />
      {/* Sweeping scanline */}
      <div
        className="absolute inset-x-0 h-24 opacity-[0.07]"
        style={{
          background:
            "linear-gradient(180deg, transparent, #00ff9f 50%, transparent)",
          animation: "scanline 7s linear infinite",
        }}
      />
      {/* Fine scanline texture */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,255,159,0.5) 0 1px, transparent 1px 4px)",
        }}
      />
      {/* Pulsing target rings */}
      {[{ left: "12%", top: "22%", size: "16vh", delay: "0s" }, { left: "78%", top: "55%", size: "22vh", delay: "1.4s" }].map(
        (r, i) => (
          <span
            key={i}
            className="absolute rounded-full border"
            style={{
              left: r.left,
              top: r.top,
              width: r.size,
              height: r.size,
              borderColor: "rgba(0,255,159,0.5)",
              animation: `neon-pulse 3.4s ease-in-out ${r.delay} infinite`,
            }}
          />
        ),
      )}
    </>
  );
}

const BOKEH = [
  { size: "34vh", left: "6%", top: "8%", color: "rgba(255,158,203,0.35)", dur: "19s", delay: "0s" },
  { size: "26vh", left: "68%", top: "6%", color: "rgba(201,162,255,0.32)", dur: "23s", delay: "-4s" },
  { size: "30vh", left: "76%", top: "58%", color: "rgba(255,201,152,0.3)", dur: "21s", delay: "-9s" },
  { size: "22vh", left: "18%", top: "62%", color: "rgba(255,158,203,0.28)", dur: "25s", delay: "-13s" },
  { size: "16vh", left: "45%", top: "30%", color: "rgba(201,162,255,0.26)", dur: "17s", delay: "-7s" },
];

const DUST = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 137) % 100}%`,
  top: `${(i * 61) % 100}%`,
  delay: `${-(i * 0.7)}s`,
  dur: `${2.6 + (i % 5) * 0.8}s`,
}));

function BloomScene() {
  return (
    <>
      {BOKEH.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-[70px]"
          style={{
            width: b.size,
            height: b.size,
            left: b.left,
            top: b.top,
            background: `radial-gradient(circle, ${b.color}, transparent 65%)`,
            animation: `bokeh-drift ${b.dur} ease-in-out infinite`,
            animationDelay: b.delay,
          }}
        />
      ))}
      {DUST.map((d, i) => (
        <span
          key={i}
          className="absolute h-[3px] w-[3px] rounded-full bg-white"
          style={{
            left: d.left,
            top: d.top,
            animation: `twinkle ${d.dur} ease-in-out infinite`,
            animationDelay: d.delay,
          }}
        />
      ))}
      {/* Falling petals */}
      {[
        { left: "18%", dur: "17s", delay: "0s", c: "rgba(255,158,203,0.7)" },
        { left: "52%", dur: "22s", delay: "-8s", c: "rgba(201,162,255,0.6)" },
        { left: "80%", dur: "19s", delay: "-13s", c: "rgba(255,201,152,0.65)" },
      ].map((p, i) => (
        <span
          key={`petal-${i}`}
          className="absolute top-0 h-3 w-2.5"
          style={{
            left: p.left,
            background: p.c,
            borderRadius: "80% 10% 80% 10%",
            animation: `petal-fall ${p.dur} linear ${p.delay} infinite`,
          }}
        />
      ))}
    </>
  );
}
