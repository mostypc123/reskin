import React, { useEffect, useState } from "react";
import "./ThemeCard.css";

export default function ThemeCard({ theme, onClick }) {
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    // Only check for recently viewed themes in Tauri
    if (window.__TAURI__) {
      import('@tauri-apps/api').then(({ exists }) => {
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
      });
    }
  }, [theme.name]);

  return (
    <div className="theme-card" onClick={onClick} style={{ cursor: "pointer", opacity: missing ? 0.5 : 1 }}>
      <img
        src={theme.preview}
        alt={theme.name || "Theme preview"}
        onError={e => { e.target.onerror = null; e.target.src = "/default-preview.png"; }}
      />
      <div className="theme-card-title">{theme.name || "Untitled Theme"}</div>
      <div className="theme-card-author">
        by {theme.author || "Unknown"}
      </div>
      {missing && (
        <div style={{ color: "#ff5555", fontWeight: "bold", marginTop: 8 }}>
          Theme file missing!<br />
          Please reinstall the theme.
        </div>
      )}
    </div>
  );
}

ThemeCard.defaultProps = {
  theme: {
    preview: "https://upload.wikimedia.org/wikipedia/commons/4/47/React.svg",
    name: "Untitled Theme",
    author: "Unknown"
  }
};