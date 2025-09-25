import en from "@/locales/en.json" assert { type: "json" };
import vi from "@/locales/vi.json" assert { type: "json" };

type Dict = Record<string, string>;

const dictionaries: Record<string, Dict> = {
  en: (en as any).default ?? (en as any),
  vi: (vi as any).default ?? (vi as any),
};

function detectLang(): "vi" | "en" {
  if (typeof localStorage !== "undefined") {
    const s = localStorage.getItem("lang");
    if (s === "vi" || s === "en") return s;
  }
  if (typeof navigator !== "undefined") {
    const l = navigator.language?.toLowerCase() ?? "en";
    if (l.startsWith("vi")) return "vi";
  }
  return "en";
}

export function t(key?: string, fallback?: string): string {
  if (!key) return fallback ?? "";
  const lang = detectLang();
  const dict = dictionaries[lang] ?? {};
  return dict[key] ?? fallback ?? key;
}

// Returns the translation if available; otherwise undefined (no fallback).
export function tOptional(key?: string): string | undefined {
  if (!key) return undefined;
  const lang = detectLang();
  const dict = dictionaries[lang] ?? {};
  return dict[key];
}

export function setLang(lang: "vi" | "en") {
  try { localStorage.setItem("lang", lang); } catch {}
}
