import { useEffect, useMemo, useRef, useState } from "react";
import { ConstellationField } from "../effects/constellation-field/ConstellationField";
import { buildMenuScript, NAV_SECTIONS } from "./menu/menuScript";
import "../effects/constellation-field/styles.css";

type Mode = "dark" | "light";
type Phase = "idle" | "out" | "in";

const MODE_TRANSITION_MS = 380;

const MODE_STORE: { value: Mode } = { value: "dark" };

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

function matchHref(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname === "";
  return pathname.startsWith(href);
}

export default function ConstellationMenu() {
  const [mode, setModeState] = useState<Mode>(MODE_STORE.value);
  const [phase, setPhase] = useState<Phase>("idle");
  const [activeHref, setActiveHref] = useState("/");
  const pendingMode = useRef<Mode | null>(null);
  const timers = useRef<number[]>([]);
  const frameWindow = useRef<Window | null>(null);
  const menuScript = useMemo(() => buildMenuScript(NAV_SECTIONS), []);

  const setMode = (next: Mode) => {
    MODE_STORE.value = next;
    setModeState(next);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.siteMode = next;
    }
  };

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

  useEffect(() => {
    setMode(MODE_STORE.value);
  }, []);

  const sendBounds = () => {
    const win = frameWindow.current;
    if (!win || typeof window === "undefined") return;
    const panels = Array.from(
      document.querySelectorAll(".content-panel, .bio-panel"),
    );
    let right = Math.round(window.innerWidth * 0.42);
    for (const el of panels) {
      right = Math.max(right, Math.ceil(el.getBoundingClientRect().right));
    }
    right = Math.min(right + 56, Math.round(window.innerWidth - 160));
    win.postMessage({ type: "constellation-bounds", minX: right }, "*");
  };

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as
        | { type?: string; href?: unknown; minX?: unknown }
        | null;
      if (!data) return;
      if (data.type === "constellation-ready" && event.source) {
        frameWindow.current = event.source as Window | null;
        sendBounds();
        return;
      }
      if (data.type !== "constellation-nav" || typeof data.href !== "string") return;
      const idx = NAV_SECTIONS.findIndex((s) => s.href === data.href);
      if (idx < 0) return;
      window.scrollTo({
        top: idx * window.innerHeight,
        behavior: prefersReducedMotion() ? "instant" : "smooth",
      });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    const update = () => {
      setActiveHref(window.location.pathname);
      document.documentElement.dataset.siteMode = MODE_STORE.value;
    };
    update();
    window.addEventListener("popstate", update);
    window.addEventListener("resize", sendBounds);
    document.addEventListener("astro:page-load" as never, update);
    document.addEventListener("astro:page-load" as never, sendBounds);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("resize", sendBounds);
      document.removeEventListener("astro:page-load" as never, update);
      document.removeEventListener("astro:page-load" as never, sendBounds);
    };
  }, []);

  const activeIndex =
    NAV_SECTIONS.findIndex((s) => matchHref(activeHref, s.href)) + 1;

  const transitioning = phase !== "idle";

  return (
    <div
      id="constellation-menu-root"
      className={`effect-frame site-constellation ${transitioning ? "is-transitioning" : ""}`}
      data-mode={mode}
    >
      <div className="effect-scene">
        <ConstellationField
          mode={mode}
          speed={0.5}
          size={0.5}
          strokeWidth={0.5}
          length={0.9}
          density={1.4}
          opacity={1}
          hue={0}
          saturation={1.1}
          brightness={1}
          suffixScript={menuScript}
        />
      </div>
      <header className="site-bar">
        <a href="#/" className="site-name" aria-label="home">
          SR0.OPERATOR
        </a>
        <span className="site-coords" aria-hidden="true">
          47.3769N 08.5417E
        </span>
        <nav className="site-nav" aria-label="primary">
          {NAV_SECTIONS.map((s) => (
            <a
              key={s.id}
              href={"#" + s.href}
              className={matchHref(activeHref, s.href) ? "is-active" : undefined}
            >
              {s.label}
            </a>
          ))}
        </nav>
        <span className="site-index" aria-hidden="true">
          {String(activeIndex).padStart(2, "0")}/{String(NAV_SECTIONS.length).padStart(2, "0")}
        </span>
        <button
          type="button"
          className="site-toggle"
          onClick={() => switchMode(mode === "dark" ? "light" : "dark")}
          disabled={transitioning}
          aria-pressed={mode === "light"}
        >
          {mode === "dark" ? "LIGHT" : "DARK"}
        </button>
      </header>
      <div className="site-rail" aria-hidden="true">
        {NAV_SECTIONS.map((s) => (
          <span
            key={s.id}
            className={matchHref(activeHref, s.href) ? "is-active" : undefined}
          >
            {s.label.slice(0, 2)}
          </span>
        ))}
      </div>
    </div>
  );
}