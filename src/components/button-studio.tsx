"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Bookmark, Check, ChevronDown, Code2, Copy, Moon, Plus, RotateCcw, Sun, Trash2, X } from "lucide-react";
import { GradientButton } from "./gradient-button";
import { exportCode, fingerprint, isSavedStyle, isStyle, migrateLegacyLabel, original, presets, type GradientStyle, type SavedStyle } from "@/lib/gradients";

const GALLERY_KEY = "only-buttons.gallery.v1";
const DRAFT_KEY = "only-buttons.draft.v1";
type Toast = { message: string; removed?: SavedStyle };

function Slider({ label, value, min, max, step = 1, unit = "", display, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string; display?: string; onChange: (value: number) => void;
}) {
  return <label className="slider-control">
    <span className="control-label"><span>{label}</span><output>{display ?? `${Number(value.toFixed(2))}${unit}`}</output></span>
    <input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))}
      style={{ "--progress": `${(value - min) / (max - min) * 100}%` } as CSSProperties} />
  </label>;
}

function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => { setText(value); }, [value]);
  return <div className="color-control">
    <label className="color-swatch" style={{ background: value }} title={label}>
      <input aria-label={`${label} color`} type="color" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
    <div className="color-value"><label htmlFor={`color-${label}`}>{label}</label>
      <input id={`color-${label}`} aria-label={`${label} hex`} spellCheck={false} maxLength={7} value={text.toUpperCase()}
        onChange={(event) => { const next = event.target.value; setText(next); if (/^#[\da-f]{6}$/i.test(next)) onChange(next.toLowerCase()); }}
        onBlur={() => setText(value)} />
    </div>
  </div>;
}

export function ButtonStudio() {
  const [view, setView] = useState<"studio" | "gallery">("studio");
  const [config, setConfig] = useState<GradientStyle>(original);
  const [resetStyle, setResetStyle] = useState<GradientStyle>(original);
  const [gallery, setGallery] = useState<SavedStyle[]>([]);
  const [ready, setReady] = useState(false);
  const [dark, setDark] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [codeTab, setCodeTab] = useState<"component" | "css">("component");
  const [copied, setCopied] = useState(false);
  const codeDialog = useRef<HTMLDialogElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageErrorShown = useRef(false);
  const currentPrint = fingerprint(config);
  const alreadySaved = gallery.some((item) => fingerprint(item.style) === currentPrint);
  const code = exportCode(config);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(GALLERY_KEY);
      const draft = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const data: unknown = JSON.parse(saved);
        if (!Array.isArray(data) || !data.every(isSavedStyle)) throw new Error("Invalid collection");
        const migrated = data.map((item) => ({ ...item, style: migrateLegacyLabel(item.style) }));
        setGallery(migrated);
        if (data.some((item, index) => item.style !== migrated[index].style)) {
          localStorage.setItem(GALLERY_KEY, JSON.stringify(migrated));
        }
      }
      if (draft) {
        const data: unknown = JSON.parse(draft);
        if (isStyle(data)) setConfig(migrateLegacyLabel(data));
      }
    } catch {
      setToast({ message: "Couldn’t load local styles." });
    }
    setReady(true);
    return () => { if (copyTimer.current) clearTimeout(copyTimer.current); };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(config)); }
    catch {
      if (!storageErrorShown.current) {
        storageErrorShown.current = true;
        setToast({ message: "Local storage unavailable. Copy your code to keep it." });
      }
    }
  }, [config, ready]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.removed ? 8000 : 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  function update<K extends keyof GradientStyle>(key: K, value: GradientStyle[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  function persist(items: SavedStyle[]) {
    try {
      localStorage.setItem(GALLERY_KEY, JSON.stringify(items));
      setGallery(items);
      return true;
    } catch {
      setToast({ message: "Couldn’t save. Local storage may be full or unavailable." });
      return false;
    }
  }

  function save(style: GradientStyle) {
    if (!ready) return;
    const snapshot = { ...style, name: style.name.trim() || "Untitled" };
    if (gallery.some((item) => fingerprint(item.style) === fingerprint(snapshot))) {
      setToast({ message: "Already in Gallery" });
      return;
    }
    const item = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), style: snapshot };
    if (persist([item, ...gallery])) {
      if (style === config) setConfig(snapshot);
      setToast({ message: "Saved to Gallery" });
    }
  }

  function select(style: GradientStyle) {
    setConfig({ ...style });
    setResetStyle({ ...style });
    setView("studio");
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  function remove(item: SavedStyle) {
    if (persist(gallery.filter((saved) => saved.id !== item.id))) setToast({ message: "Removed from Gallery", removed: item });
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code[codeTab]);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch { setToast({ message: "Copy unavailable. Select the code to copy it." }); }
  }

  function renderCard(style: GradientStyle, item?: SavedStyle) {
    const saved = gallery.some((entry) => fingerprint(entry.style) === fingerprint(style));
    return <article className={`style-card ${!item && currentPrint === fingerprint(style) ? "is-selected" : ""}`} key={item?.id ?? style.name}>
      <button className="card-preview" type="button" aria-label={`Edit ${style.name}`} onClick={() => select(style)}>
        <span className="card-scale" style={{ "--card-scale": Math.min(0.82, 212 / style.width) } as CSSProperties}>
          <GradientButton config={style} compact />
        </span>
      </button>
      <div className="card-footer"><span>{style.name}</span>
        {item ? <button className="icon-button card-action" aria-label={`Remove ${style.name}`} title="Remove" onClick={() => remove(item)}><Trash2 size={15} /></button>
          : <button className={`icon-button card-action ${saved ? "is-saved" : ""}`} disabled={!ready || saved} aria-label={saved ? `${style.name} saved` : `Save ${style.name}`} title={saved ? "Saved" : "Save to Gallery"} onClick={() => save(style)}><Bookmark size={16} fill={saved ? "currentColor" : "none"} /></button>}
      </div>
    </article>;
  }

  return <>
    <header className="site-header">
      <div className="header-inner">
        <button className="wordmark" onClick={() => setView("studio")} aria-label="only-buttons home"><span className="brand-mark" aria-hidden="true" />only-buttons<span className="wordmark-dot">.</span></button>
        <nav className="navigation" aria-label="Main navigation">
          <button className={view === "studio" ? "active" : ""} aria-pressed={view === "studio"} onClick={() => setView("studio")}>Studio</button>
          <button className={view === "gallery" ? "active" : ""} aria-pressed={view === "gallery"} onClick={() => setView("gallery")}>Gallery<span className="nav-count">{gallery.length}</span></button>
        </nav>
      </div>
    </header>

    <main>
      {view === "studio" ? <>
        <section className="editor" aria-label="Button editor">
          <div className={`preview ${dark ? "preview-dark" : ""}`}>
            <div className="preview-toolbar"><span>Preview</span>
              <div className="toolbar-actions">
                <button className="icon-button" aria-label="Reset style" title="Reset style" onClick={() => setConfig({ ...resetStyle })}><RotateCcw size={16} /></button>
                <button className="icon-button" aria-label="View code" title="View code" onClick={() => { setCopied(false); codeDialog.current?.showModal(); }}><Code2 size={19} /></button>
              </div>
            </div>
            <div className="preview-center"><div className="live-scale" style={{ "--button-width": config.width } as CSSProperties}><GradientButton config={config} /></div></div>
            <div className="preview-bottom"><span className="dimensions">{config.width} <span>×</span> {config.height}</span>
              <div className="background-switch" role="group" aria-label="Preview background">
                <button aria-label="Light background" aria-pressed={!dark} className={!dark ? "selected" : ""} onClick={() => setDark(false)}><Sun size={15} /></button>
                <button aria-label="Dark background" aria-pressed={dark} className={dark ? "selected" : ""} onClick={() => setDark(true)}><Moon size={14} /></button>
              </div>
              <span className="preview-name">{config.name || "Untitled"}</span>
            </div>
          </div>

          <aside className="inspector" aria-label="Appearance controls">
            <div className="inspector-heading"><h1>Appearance</h1><span className="small-pill">Static</span></div>
            <div className="text-fields">
              <label className="text-field"><span>Name</span><input aria-label="Style name" value={config.name} maxLength={40} onChange={(event) => update("name", event.target.value)} /></label>
              <label className="text-field"><span>Label</span><input aria-label="Button label" value={config.label} maxLength={40} onChange={(event) => update("label", event.target.value)} /></label>
            </div>

            <div className="control-section colors-section">
              <div className="section-label">Colors<div className="ink-switch" role="group" aria-label="Text color">
                <button className={config.ink === "#ffffff" ? "selected" : ""} aria-label="White text" aria-pressed={config.ink === "#ffffff"} onClick={() => update("ink", "#ffffff")}><span className="white-dot" /></button>
                <button className={config.ink !== "#ffffff" ? "selected" : ""} aria-label="Black text" aria-pressed={config.ink !== "#ffffff"} onClick={() => update("ink", "#171717")}><span className="black-dot" /></button>
              </div></div>
              <div className="colors-grid">
                <ColorControl label="Base" value={config.violet} onChange={(value) => update("violet", value)} />
                <ColorControl label="Glow" value={config.red} onChange={(value) => update("red", value)} />
                <ColorControl label="Bloom" value={config.rose} onChange={(value) => update("rose", value)} />
              </div>
            </div>

            <div className="control-section grain-section"><Slider label="Grain" value={config.grain} min={0} max={100} unit="%" onChange={(value) => update("grain", value)} /></div>

            <div className="control-section shape-section">
              <Slider label="Width" value={config.width} min={140} max={400} unit=" px" onChange={(value) => update("width", value)} />
              <Slider label="Height" value={config.height} min={36} max={96} unit=" px" onChange={(value) => update("height", value)} />
              <Slider label="Radius" value={Math.min(config.radius, 48)} min={0} max={48} unit=" px" display={config.radius >= 48 ? "Full" : undefined} onChange={(value) => update("radius", value === 48 ? 999 : value)} />
            </div>

            <details className="advanced-controls"><summary>Gradient<ChevronDown size={14} /></summary><div className="advanced-content">
              <Slider label="Angle" value={config.angle} min={0} max={360} unit="°" onChange={(value) => update("angle", value)} />
              <Slider label="Glow X" value={config.glowX} min={0} max={100} step={0.01} unit="%" onChange={(value) => update("glowX", value)} />
              <Slider label="Glow Y" value={config.glowY} min={0} max={160} step={0.01} unit="%" onChange={(value) => update("glowY", value)} />
              <Slider label="Bloom X" value={config.bloomX} min={0} max={100} step={0.01} unit="%" onChange={(value) => update("bloomX", value)} />
              <Slider label="Bloom Y" value={config.bloomY} min={0} max={160} step={0.01} unit="%" onChange={(value) => update("bloomY", value)} />
              <Slider label="Grain scale" value={config.frequency} min={0.1} max={1.5} step={0.01} onChange={(value) => update("frequency", value)} />
            </div></details>

            <button className={`save-button ${alreadySaved ? "saved" : ""}`} onClick={() => save(config)} disabled={!ready || alreadySaved}>{alreadySaved ? <Check size={16} /> : <Plus size={17} />}{alreadySaved ? "Saved to Gallery" : "Save to Gallery"}</button>
          </aside>
        </section>

        <section className="collection" aria-labelledby="collection-title"><div className="collection-heading"><h2 id="collection-title">Explore<span>{presets.length.toString().padStart(2, "0")}</span></h2></div><div className="style-grid">{presets.map((style) => renderCard(style))}</div></section>
      </> : <section className="gallery-page" aria-labelledby="gallery-title"><div className="gallery-heading"><h1 id="gallery-title">Gallery<span>{gallery.length.toString().padStart(2, "0")}</span></h1><button className="new-button" onClick={() => setView("studio")}><Plus size={16} />New style</button></div>
        {gallery.length ? <div className="style-grid saved-grid">{gallery.map((item) => renderCard(item.style, item))}</div> : <div className="empty-gallery"><Bookmark size={28} strokeWidth={1.2} /><p>No saved styles yet.</p><button onClick={() => setView("studio")}>Explore styles</button></div>}
      </section>}
    </main>

    <dialog ref={codeDialog} className="code-dialog" onClick={(event) => { if (event.target === event.currentTarget) codeDialog.current?.close(); }}>
      <div className="code-dialog-inner"><div className="code-heading"><h2>{config.name || "Untitled"}</h2><button className="icon-button" aria-label="Close code" onClick={() => codeDialog.current?.close()}><X size={19} /></button></div>
        <div className="code-tabs"><div role="group" aria-label="Code file"><button aria-pressed={codeTab === "component"} className={codeTab === "component" ? "active" : ""} onClick={() => { setCodeTab("component"); setCopied(false); }}>gradient-button.tsx</button><button aria-pressed={codeTab === "css"} className={codeTab === "css" ? "active" : ""} onClick={() => { setCodeTab("css"); setCopied(false); }}>gradient-button.css</button></div><button className="copy-button" onClick={copyCode}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</button></div>
        <pre tabIndex={0}><code>{code[codeTab]}</code></pre>
      </div>
    </dialog>

    <div className="toast-region" role="status" aria-live="polite">{toast && <div className="toast"><Check size={15} /><span>{toast.message}</span>{toast.removed && <button onClick={() => { if (toast.removed && persist([toast.removed, ...gallery])) setToast({ message: "Restored to Gallery" }); }}>Undo</button>}</div>}</div>
  </>;
}
