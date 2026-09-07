import { useEffect, useMemo, useRef, useState } from "react";
import { ConstellationField } from "../effects/constellation-field/ConstellationField";
import { buildMenuScript, NAV_SECTIONS } from "./menu/menuScript";
import { SITE, CONTACT } from "../data/site";
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

function scrollToIndex(index: number, behavior: "instant" | "smooth") {
  window.scrollTo({
    top: index * window.innerHeight,
    behavior: prefersReducedMotion() ? "instant" : behavior,
  });
}

function routeFromHash() {
  const hash = window.location.hash.slice(1);
  const idx = NAV_SECTIONS.findIndex((s) => s.href === hash);
  return idx >= 0 ? NAV_SECTIONS[idx].href : "/";
}

export default function ConstellationMenu() {
  const [mode, setModeState] = useState<Mode>(MODE_STORE.value);
  const [phase, setPhase] = useState<Phase>("idle");
  const [activeHref, setActiveHref] = useState("/");
  const currentIndex = useRef<string>("/");
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
    document.documentElement.dataset.siteMode = MODE_STORE.value;
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

  const goTo = (href: string) => {
    const idx = NAV_SECTIONS.findIndex((s) => s.href === href);
    if (idx < 0) return;
    if (href === currentIndex.current) return;
    currentIndex.current = href;
    setActiveHref(href);
    window.history.pushState(null, "", "#" + href);
    frameWindow.current?.postMessage({ type: "constellation-route", href }, "*");
    scrollToIndex(idx, "smooth");
  };

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== "null") return;
      const data = event.data as
        | { type?: string; href?: unknown; minX?: unknown }
        | null;
      if (!data) return;
      if (data.type === "constellation-ready" && event.source) {
        frameWindow.current = event.source as Window | null;
        sendBounds();
        frameWindow.current?.postMessage(
          { type: "constellation-route", href: routeFromHash() },
          "*",
        );
        return;
      }
      if (data.type !== "constellation-nav" || typeof data.href !== "string") return;
      if (event.source !== frameWindow.current) return;
      goTo(data.href);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const raw = document.scrollingElement?.scrollTop ?? 0;
      const index = Math.min(
        Math.max(Math.round(raw / window.innerHeight), 0),
        NAV_SECTIONS.length - 1,
      );
      const href = NAV_SECTIONS[index].href;
      if (href === currentIndex.current) return;
      currentIndex.current = href;
      setActiveHref(href);
      window.history.replaceState(null, "", "#" + href);
      frameWindow.current?.postMessage({ type: "constellation-route", href }, "*");
    };
    const onResize = () => {
      sendBounds();
      if (document.scrollingElement) {
        scrollToIndex(
          Math.min(
            Math.max(Math.round(document.scrollingElement.scrollTop / window.innerHeight), 0),
            NAV_SECTIONS.length - 1,
          ),
          "instant",
        );
      }
    };
    const onPopState = () => {
      const href = routeFromHash();
      const idx = NAV_SECTIONS.findIndex((s) => s.href === href);
      if (idx < 0) return;
      const at = Math.round((document.scrollingElement?.scrollTop ?? 0) / window.innerHeight);
      if (href === currentIndex.current && at === idx) return;
      currentIndex.current = href;
      setActiveHref(href);
      scrollToIndex(idx, "smooth");
    };

    const initial = routeFromHash();
    const initialIndex = NAV_SECTIONS.findIndex((s) => s.href === initial);
    currentIndex.current = initial;
    setActiveHref(initial);
    if (initialIndex > 0) {
      scrollToIndex(initialIndex, "instant");
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

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
        <a
          href="#/"
          className="site-name"
          aria-label="home"
          onClick={(e) => {
            e.preventDefault();
            goTo("/");
          }}
        >
          {SITE.handle}
        </a>
        <div className="site-controls">
          <a
            href={CONTACT.linkedin}
            className="site-linkedin"
            aria-label="Wissam Ataleh on LinkedIn"
            target="_blank"
            rel="noreferrer"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
            </svg>
          </a>
          <a
            href="https://github.com/wissamataleh/wissamataleh.github.io"
            className="site-github"
            aria-label="View the source on GitHub"
            target="_blank"
            rel="noreferrer"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.67.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
            </svg>
          </a>
          <a
            href={CONTACT.cv}
            className="site-cv"
            aria-label="Download the CV PDF"
            download
            rel="noreferrer"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="M7 10l5 5 5-5" />
              <path d="M12 15V3" />
            </svg>
          </a>
          <button
            type="button"
            className="site-toggle"
            onClick={() => switchMode(mode === "dark" ? "light" : "dark")}
            disabled={transitioning}
            aria-pressed={mode === "light"}
            aria-label={
              mode === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
          {mode === "dark" ? (
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
          </button>
        </div>
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