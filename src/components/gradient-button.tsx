"use client";

import { useId, type CSSProperties, type ReactNode } from "react";
import { ChampagneIcon } from "@phosphor-icons/react/dist/csr/Champagne";
import { background, type GradientStyle } from "@/lib/gradients";

export function GradientButton({ config, compact = false, children }: { config: GradientStyle; compact?: boolean; children?: ReactNode }) {
  const filterId = useId();
  const style = {
    "--gradient": background(config),
    "--grain": config.grain / 100,
    width: config.width,
    height: config.height,
    borderRadius: config.radius,
    color: config.ink,
  } as CSSProperties;

  const content = <>
    <svg className="static-gradient__grain" aria-hidden="true" focusable="false">
      <defs>
        <filter id={filterId} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={config.frequency} numOctaves={3} seed={7} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter={`url(#${filterId})`} />
    </svg>
    <span className="gradient-label">{children ?? config.label}</span>
    <ChampagneIcon className="gradient-icon" size={20} weight="regular" aria-hidden="true" focusable="false" />
  </>;

  // Cards own their click target; avoid nesting buttons inside buttons.
  if (compact) return <span className="static-gradient compact-gradient" style={style}>{content}</span>;
  return <button type="button" className="static-gradient live-gradient" style={style}>{content}</button>;
}
