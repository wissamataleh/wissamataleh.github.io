import { useEffect, useRef, useState } from "react";
import { ConstellationField } from "./effects/constellation-field/ConstellationField";
import "./effects/constellation-field/styles.css";

type Mode = "dark" | "light";
type Phase = "idle" | "out" | "in";

const MODE_TRANSITION_MS = 380;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

export function Scene() {
  const [mode, setMode] = useState<Mode>("dark");
  const [phase, setPhase] = useState<Phase>("idle");
  const pendingMode = useRef<Mode | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const current = timers.current;
    return () => current.forEach((id) => window.clearTimeout(id));
  }, []);

  const switchMode = (next: Mode) => {
    if (next === mode || next === pendingMode.current) return;
    if (prefersReducedMotion()) {
      setMode(next);
      return;
    }
    pendingMode.current = next;
    setPhase("out");
    timers.current.push(
      window.setTimeout(() => {
        setMode(next);
        setPhase("in");
        timers.current.push(
          window.setTimeout(() => {
            setPhase("idle");
            pendingMode.current = null;
          }, MODE_TRANSITION_MS + 40),
        );
      }, MODE_TRANSITION_MS),
    );
  };

  const transitioning = phase !== "idle";

  return (
    <div className={`effect-frame ${transitioning ? "is-transitioning" : ""}`} data-mode={mode}>
      <div className="effect-scene">
        <ConstellationField
          mode={mode}
          speed={0.0}
          size={0.5}
          strokeWidth={0.5}
          length={0.9}
          density={1.4}
          opacity={1.0}
          hue={0}
          saturation={1.1}
          brightness={1.0}
        />
      </div>
      <button
        type="button"
        className="effect-toggle"
        onClick={() => switchMode(mode === "dark" ? "light" : "dark")}
        disabled={transitioning}
        aria-pressed={mode === "light"}
      >
        {mode === "dark" ? "Switch to Light" : "Switch to Dark"}
      </button>
    </div>
  );
}