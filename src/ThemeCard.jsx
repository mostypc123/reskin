// Import necessary components
import React, { useEffect, useState } from "react";
import "./ThemeCard.css";
import { getTranslationObject } from "./locales/index.js";
import "@tauri-apps/api/core";

export default function ThemeCard({ theme, onClick }) {
  // Use stored language or fallback to English
  const language = localStorage.getItem("reskin_language") || "en";
  const t = getTranslationObject(language);

  const [missing, setMissing] = useState(false);

  useEffect(() => {
    // Only check for recently viewed themes in Tauri
    if (window.__TAURI__) {
      const checkFile = async () => {
        try {
          const filePath = `/tmp/reskin/${theme.name}.reskin`;
          const fileExists = await exists(filePath);
          setMissing(!fileExists);
        } catch {
          setMissing(true);
        }
      };
      checkFile();
    }
  }, [theme.name]);

  return (
    <div
      className="theme-card"
      onClick={onClick}
      style={{ cursor: "pointer", opacity: missing ? 0.5 : 1 }}
    >
      <img
        src={theme.preview}
        alt={theme.name || t.themeCard.preview_alt}
        onError={e => { e.target.onerror = null; e.target.src = "/default-preview.png"; }}
        style={{ opacity: missing ? 0.5 : 1 }}
      />
      <div className="theme-card-title">{theme.name || t.themeCard.untitled}</div>
      <div className="theme-card-author">
        {t.themeCard.by} {theme.author || t.themeCard.unknown}
      </div>
      {missing && (
        <div style={{ color: "#ff5555", fontWeight: "bold", marginTop: 8 }}>
          {t.themeCard.missing_title}<br />
          {t.themeCard.missing_desc}
        </div>
      )}
    </div>
  );
}

// Define default ThemeCard properties
ThemeCard.defaultProps = {
  theme: {
    preview: "https://upload.wikimedia.org/wikipedia/commons/4/47/React.svg",
    name: "Untitled Theme",
    author: "Unknown"
  }
};
