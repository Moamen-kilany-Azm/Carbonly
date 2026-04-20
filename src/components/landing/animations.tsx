"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

// ─── Inject global keyframes once ─────────────────────────────────────────────

let injected = false;

export function AnimationStyles() {
  if (injected) return null;
  injected = true;
  return (
    <style>{`
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(32px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.92); }
        to   { opacity: 1; transform: scale(1); }
      }
      @keyframes slideRight {
        from { opacity: 0; transform: translateX(-28px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50%       { transform: translateY(-10px); }
      }
      @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 12px rgba(22,163,74,0.4); }
        50%       { box-shadow: 0 0 28px rgba(22,163,74,0.75), 0 0 60px rgba(22,163,74,0.25); }
      }
      @keyframes shimmer {
        0%   { background-position: -400px 0; }
        100% { background-position: 400px 0; }
      }
      @keyframes spin-slow {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      @keyframes counter-up {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes blob-drift {
        0%, 100% { transform: translate(0,0) scale(1); }
        33%       { transform: translate(30px,-20px) scale(1.07); }
        66%       { transform: translate(-20px,15px) scale(0.95); }
      }
      @keyframes bar-grow {
        from { transform: scaleX(0); }
        to   { transform: scaleX(1); }
      }
      @keyframes dash-draw {
        from { stroke-dashoffset: 1000; }
        to   { stroke-dashoffset: 0; }
      }
    `}</style>
  );
}

// ─── Intersection-observer reveal hook ────────────────────────────────────────

export function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

// ─── Reveal wrapper ────────────────────────────────────────────────────────────

type RevealProps = {
  children: ReactNode;
  animation?: "fadeUp" | "fadeIn" | "scaleIn" | "slideRight";
  delay?: number;        // ms
  duration?: number;     // ms
  style?: CSSProperties;
  className?: string;
};

export function Reveal({
  children,
  animation = "fadeUp",
  delay = 0,
  duration = 600,
  style,
  className,
}: RevealProps) {
  const { ref, visible } = useReveal();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        animation: visible
          ? `${animation} ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms both`
          : "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Staggered children reveal ────────────────────────────────────────────────

type StaggerProps = {
  children: ReactNode[];
  animation?: "fadeUp" | "scaleIn" | "fadeIn";
  stagger?: number;      // ms between each child
  delay?: number;        // initial delay
  duration?: number;
  style?: CSSProperties; // applied to the wrapper
  itemStyle?: CSSProperties;
};

export function Stagger({
  children,
  animation = "fadeUp",
  stagger = 80,
  delay = 0,
  duration = 550,
  style,
  itemStyle,
}: StaggerProps) {
  const { ref, visible } = useReveal();

  return (
    <div ref={ref} style={style}>
      {(children as ReactNode[]).map((child, i) => (
        <div
          key={i}
          style={{
            opacity: visible ? 1 : 0,
            animation: visible
              ? `${animation} ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay + i * stagger}ms both`
              : "none",
            ...itemStyle,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// ─── Animated number counter ──────────────────────────────────────────────────

export function CountUp({ value, suffix = "" }: { value: string; suffix?: string }) {
  const { ref, visible } = useReveal(0.3);
  // Extract leading number for counting, keep rest as suffix
  const match = value.match(/^([\d,.]+)(.*)/);
  const numStr = match?.[1] ?? value;
  const rest = (match?.[2] ?? "") + suffix;
  const num = parseFloat(numStr.replace(/,/g, ""));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!visible || isNaN(num)) return;
    const duration = 1400;
    const steps = 60;
    const stepTime = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * num);
      if (step >= steps) clearInterval(timer);
    }, stepTime);
    return () => clearInterval(timer);
  }, [visible, num]);

  if (isNaN(num)) {
    return (
      <span ref={ref} style={{
        display: "inline-block",
        opacity: visible ? 1 : 0,
        animation: visible ? "counter-up 0.6s cubic-bezier(0.22,1,0.36,1) both" : "none",
      }}>
        {value}
      </span>
    );
  }

  const formatted = numStr.includes(",")
    ? Math.round(display).toLocaleString()
    : numStr.includes(".")
    ? display.toFixed(1)
    : Math.round(display).toString();

  return (
    <span ref={ref} style={{
      display: "inline-block",
      opacity: visible ? 1 : 0,
      animation: visible ? "counter-up 0.6s cubic-bezier(0.22,1,0.36,1) both" : "none",
    }}>
      {formatted}{rest}
    </span>
  );
}

// ─── Floating wrapper ─────────────────────────────────────────────────────────

export function Float({ children, duration = 4, delay = 0, style }: {
  children: ReactNode;
  duration?: number;
  delay?: number;
  style?: CSSProperties;
}) {
  return (
    <div style={{
      animation: `float ${duration}s ease-in-out ${delay}s infinite`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Animated gradient border card ───────────────────────────────────────────

export function GlowCard({ children, active, style }: {
  children: ReactNode;
  active?: boolean;
  style?: CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);
  const on = active ?? hovered;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transition: "border-color 0.25s, box-shadow 0.25s, transform 0.25s",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: on ? "0 8px 32px rgba(22,163,74,0.18)" : "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Typewriter badge ─────────────────────────────────────────────────────────

export function TypewriterBadge({ texts }: { texts: string[] }) {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const target = texts[idx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && displayed.length < target.length) {
      timeout = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 65);
    } else if (!deleting && displayed.length === target.length) {
      timeout = setTimeout(() => setDeleting(true), 2000);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setIdx((i) => (i + 1) % texts.length);
    }

    return () => clearTimeout(timeout);
  }, [displayed, deleting, idx, texts]);

  return (
    <span>
      {displayed}
      <span style={{
        display: "inline-block", width: 2, height: "1em",
        background: "#4ade80", marginLeft: 2, verticalAlign: "middle",
        animation: "fadeIn 0.8s step-start infinite",
      }} />
    </span>
  );
}
