"use client";
import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { atlasUrls, assetUrl } from "@/game/assets";
import manifest from "@/game/art/asset-manifest.json";
import { getAudio } from "@/game/audio/engine";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-saffron text-ink hover:brightness-110",
  secondary: "bg-cream text-ink hover:brightness-95",
  ghost: "bg-plum text-cream hover:brightness-125",
  danger: "bg-red-600 text-white hover:brightness-110",
  success: "bg-emerald-500 text-ink hover:brightness-110",
};

export function Button({
  variant = "primary",
  className = "",
  size = "md",
  children,
  onClick,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  const sz = size === "lg" ? "px-5 py-3 text-base" : size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm";
  return (
    <button
      type="button"
      className={`btn ${VARIANTS[variant]} ${sz} ${className}`}
      onClick={(e) => {
        getAudio().unlock();
        getAudio().sfx("click");
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Panel({ children, className = "", title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <section className={`panel p-4 ${className}`} aria-label={title}>
      {title && <h2 className="font-pixel mb-3 text-sm font-bold uppercase text-saffron">{title}</h2>}
      {children}
    </section>
  );
}

export function ScreenShell({
  title,
  onBack,
  children,
  right,
}: {
  title: string;
  onBack?: () => void;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-4 px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} aria-label="Back">
            ◀ Back
          </Button>
        )}
        <h1 className="font-pixel flex-1 text-lg font-black uppercase tracking-wider text-cream">{title}</h1>
        {right}
      </header>
      {children}
    </main>
  );
}

export function Meter({
  label,
  value,
  color,
  icon,
  compact = false,
  alarm = false,
}: {
  label: string;
  value: number;
  color: string;
  icon?: string;
  compact?: boolean;
  alarm?: boolean;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={compact ? "" : "w-full"}>
      <div className="font-pixel flex justify-between text-[10px] font-bold uppercase leading-tight text-cream drop-shadow-[0_1px_0_#000]">
        <span>
          {icon} {label}
        </span>
        <span>{Math.round(v)}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v)}
        className={`relative h-3 overflow-hidden rounded-sm border-2 border-black bg-black/60 ${alarm ? "animate-alarm" : ""}`}
      >
        <div className="h-full transition-[width] duration-300" style={{ width: `${v}%`, background: color }} />
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0_9%,rgba(0,0,0,0.35)_9%_10%)]" />
      </div>
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2">
      <span>
        <span className="block font-semibold">{label}</span>
        {description && <span className="block text-xs text-cream/60">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full border-2 border-black transition-colors ${checked ? "bg-saffron" : "bg-black/50"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-cream transition-all ${checked ? "left-6" : "left-0.5"}`} />
      </button>
    </label>
  );
}

export function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block py-2">
      <span className="flex justify-between font-semibold">
        <span>{label}</span>
        <span className="font-pixel text-sm">{Math.round(value * 100)}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="mt-1 w-full accent-[#f57c12]"
        aria-label={label}
      />
    </label>
  );
}

// ─────────────────────── sprite rendering from the generated atlases ───────────────────────

type AtlasJson = { frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }>; meta: { size: { w: number; h: number } } };
const atlasCache = new Map<string, Promise<AtlasJson | null>>();

function loadAtlas(sheet: string) {
  let p = atlasCache.get(sheet);
  if (!p) {
    const urls = atlasUrls(sheet);
    p = urls
      ? fetch(urls.json)
          .then((r) => (r.ok ? (r.json() as Promise<AtlasJson>) : null))
          .catch(() => null)
      : Promise.resolve(null);
    atlasCache.set(sheet, p);
  }
  return p;
}

export function Sprite({
  sheet,
  frames,
  scale = 3,
  fps = 4,
  className = "",
  alt,
  animate = true,
}: {
  sheet: string;
  frames: string[];
  scale?: number;
  fps?: number;
  className?: string;
  alt: string;
  animate?: boolean;
}) {
  const [atlas, setAtlas] = useState<AtlasJson | null>(null);
  const [i, setI] = useState(0);
  useEffect(() => {
    let live = true;
    void loadAtlas(sheet).then((a) => live && setAtlas(a));
    return () => {
      live = false;
    };
  }, [sheet]);
  useEffect(() => {
    if (!animate || frames.length < 2) return;
    const reduce = typeof document !== "undefined" && document.documentElement.classList.contains("reduced-motion");
    if (reduce) return;
    const t = setInterval(() => setI((x) => (x + 1) % frames.length), 1000 / fps);
    return () => clearInterval(t);
  }, [frames.length, fps, animate]);
  const f = atlas?.frames[frames[i % frames.length]]?.frame;
  const png = (manifest.atlases as Record<string, { png: string }>)[sheet]?.png;
  if (!f || !atlas || !png) return <div role="img" aria-label={alt} className={className} style={{ width: 48 * scale, height: 56 * scale }} />;
  return (
    <div
      role="img"
      aria-label={alt}
      className={`pixel ${className}`}
      style={{
        width: f.w * scale,
        height: f.h * scale,
        backgroundImage: `url(${assetUrl(png)})`,
        backgroundPosition: `-${f.x * scale}px -${f.y * scale}px`,
        backgroundSize: `${atlas.meta.size.w * scale}px ${atlas.meta.size.h * scale}px`,
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}

export function BgPreview({ level, className = "" }: { level: string; className?: string }) {
  const imgs = manifest.images as Record<string, string>;
  const far = imgs[`bg-${level}-far`];
  const near = imgs[`bg-${level}-near`];
  return (
    <div className={`pixel relative overflow-hidden ${className}`} aria-hidden>
      {far && (
        <div
          className="pixel absolute inset-x-0 bottom-3 h-full"
          style={{ backgroundImage: `url(${assetUrl(far)})`, backgroundSize: "auto 100%", backgroundPosition: "bottom left", backgroundRepeat: "repeat-x" }}
        />
      )}
      {near && (
        <div
          className="pixel absolute inset-x-0 bottom-0 h-3/4"
          style={{ backgroundImage: `url(${assetUrl(near)})`, backgroundSize: "auto 100%", backgroundPosition: "bottom left", backgroundRepeat: "repeat-x" }}
        />
      )}
    </div>
  );
}
