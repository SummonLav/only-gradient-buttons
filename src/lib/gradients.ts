export type GradientStyle = {
  name: string;
  label: string;
  violet: string;
  red: string;
  rose: string;
  ink: string;
  angle: number;
  grain: number;
  frequency: number;
  width: number;
  height: number;
  radius: number;
  glowX: number;
  glowY: number;
  bloomX: number;
  bloomY: number;
};

export type SavedStyle = { id: string; createdAt: string; style: GradientStyle };

export const original: GradientStyle = {
  name: "Aurora", label: "Order now",
  violet: "#ca93f0", red: "#d03033", rose: "#c986db", ink: "#ffffff",
  angle: 180, grain: 18, frequency: 0.85, width: 258, height: 64,
  radius: 999, glowX: 36.4, glowY: 83.93, bloomX: 34.05, bloomY: 135,
};

const preset = (name: string, violet: string, red: string, rose: string, extra: Partial<GradientStyle> = {}): GradientStyle =>
  ({ ...original, name, violet, red, rose, ...extra });

export const presets: GradientStyle[] = [
  original,
  preset("Dusk", "#c2a5f5", "#6244ad", "#f59db9", { glowX: 62, bloomX: 78 }),
  preset("Ember", "#ffb55a", "#e24623", "#ffe08c", { bloomX: 74, bloomY: 124 }),
  preset("Tide", "#9be1ed", "#167580", "#81dfb1", { glowX: 62 }),
  preset("Midnight", "#7787e7", "#252858", "#9288e8", { bloomX: 70, grain: 24 }),
  preset("Bloom", "#f9d2ed", "#e58cac", "#ffddd2", { ink: "#512e43", glowX: 66, grain: 15 }),
  preset("Moss", "#c3d4a0", "#4d694d", "#c9d597", { bloomX: 77, glowX: 54 }),
  preset("Apricot", "#ffdfb8", "#ee9876", "#ffc8cf", { ink: "#583f30", glowX: 74 }),
  preset("Cobalt", "#8bb9ff", "#2355d2", "#74ccfa", { bloomX: 70, bloomY: 120 }),
  preset("Graphite", "#92959b", "#292a30", "#91949a", { bloomX: 68, grain: 25 }),
  preset("Lagoon", "#a6f1d4", "#158b83", "#8cdde7", { glowX: 72, bloomX: 75 }),
  preset("Rosewood", "#e6aebc", "#8b3448", "#ecaa80", { glowX: 62, bloomX: 70 }),
];

export function background(style: GradientStyle) {
  return `radial-gradient(ellipse 54.28% 76.4% at ${style.bloomX}% ${style.bloomY}%, ${style.rose}, transparent), radial-gradient(ellipse 76.74% 144.77% at ${style.glowX}% ${style.glowY}%, ${style.red} 9.9%, transparent), linear-gradient(${style.angle}deg, ${style.violet}, ${style.red})`;
}

export function fingerprint(style: GradientStyle) {
  return JSON.stringify(Object.keys(original).map((key) => style[key as keyof GradientStyle]));
}

const ranges: Record<string, [number, number]> = {
  angle: [0, 360], grain: [0, 100], frequency: [0.1, 1.5],
  width: [140, 400], height: [36, 96], radius: [0, 999],
  glowX: [0, 100], glowY: [0, 160], bloomX: [0, 100], bloomY: [0, 160],
};

export function isStyle(value: unknown): value is GradientStyle {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  if (typeof s.name !== "string" || s.name.length > 40 || typeof s.label !== "string" || s.label.length > 40) return false;
  if (!["violet", "red", "rose", "ink"].every((key) => typeof s[key] === "string" && /^#[0-9a-f]{6}$/i.test(s[key] as string))) return false;
  return Object.entries(ranges).every(([key, [min, max]]) => typeof s[key] === "number" && Number.isFinite(s[key]) && (s[key] as number) >= min && (s[key] as number) <= max);
}

export function isSavedStyle(value: unknown): value is SavedStyle {
  if (!value || typeof value !== "object") return false;
  const item = value as SavedStyle;
  return typeof item.id === "string" && typeof item.createdAt === "string" && isStyle(item.style);
}

export function migrateLegacyLabel(style: GradientStyle): GradientStyle {
  return style.label === "Download Desktop" ? { ...style, label: original.label } : style;
}

export function exportCode(style: GradientStyle) {
  const component = `"use client";

import { useId, type ButtonHTMLAttributes } from "react";
// npm install @phosphor-icons/react
import { ChampagneIcon } from "@phosphor-icons/react/dist/csr/Champagne";
import "./gradient-button.css";

export function GradientButton({
  children = ${JSON.stringify(style.label)},
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const filterId = useId();

  return (
    <button type={type} className={\`static-gradient \${className}\`} {...props}>
      <svg className="static-gradient__grain" aria-hidden="true" focusable="false">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="${style.frequency}" numOctaves={3} seed={7} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter={\`url(#\${filterId})\`} />
      </svg>
      <span className="gradient-label">{children}</span>
      <ChampagneIcon className="gradient-icon" size={20} weight="regular" aria-hidden="true" focusable="false" />
    </button>
  );
}
`;
  const css = `.static-gradient {
  box-sizing: border-box;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
  width: ${style.width}px;
  height: ${style.height}px;
  padding: 0 16px;
  border: 0;
  border-radius: ${style.radius}px;
  color: ${style.ink};
  background: transparent;
  font: 600 15px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  text-align: center;
  cursor: pointer;
}

.static-gradient::before,
.static-gradient__grain {
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  pointer-events: none;
}

.static-gradient::before {
  content: "";
  background:
    radial-gradient(ellipse 54.28% 76.4% at ${style.bloomX}% ${style.bloomY}%, ${style.rose}, transparent),
    radial-gradient(ellipse 76.74% 144.77% at ${style.glowX}% ${style.glowY}%, ${style.red} 9.9%, transparent),
    linear-gradient(${style.angle}deg, ${style.violet}, ${style.red});
}

.static-gradient__grain {
  width: 100%;
  height: 100%;
  opacity: ${style.grain / 100};
  mix-blend-mode: soft-light;
}

.gradient-label {
  min-width: 0;
  overflow-wrap: anywhere;
}

.gradient-icon {
  flex-shrink: 0;
}

.static-gradient:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 4px;
}

.static-gradient:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;
  return { component, css };
}
