import React from "react";
import { setLang } from "@/lib/i18n";

export function LanguageToggle() {
  const [lang, setLocal] = React.useState<string>(() => {
    try {
      return localStorage.getItem("lang") || (navigator.language?.startsWith("vi") ? "vi" : "en");
    } catch {
      return "en";
    }
  });

  const change = (next: "en" | "vi") => {
    setLang(next);
    setLocal(next);
    // For simplicity, reload to ensure all texts recompute across app
    location.reload();
  };

  return (
    <div className="fixed top-3 right-3 bg-white/80 backdrop-blur border rounded px-2 py-1 text-sm shadow">
      <button
        className={`px-2 py-1 rounded ${lang === "en" ? "bg-blue-600 text-white" : "text-gray-700"}`}
        onClick={() => change("en")}
      >
        EN
      </button>
      <button
        className={`ml-1 px-2 py-1 rounded ${lang === "vi" ? "bg-blue-600 text-white" : "text-gray-700"}`}
        onClick={() => change("vi")}
      >
        VI
      </button>
    </div>
  );
}

