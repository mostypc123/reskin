// Import necessary components
import React, { useEffect, useState } from "react";
import "./ThemeCard.css";
import "@tauri-apps/api/core";

export default function ThemeCard({ theme, onClick }) {
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    // Only check for recently viewed themes in Tauri
    if (window.__TAURI__) {
      {
        const checkFile = async () => {
          try {
            // Check for the .reskin file in /tmp/reskin
            const filePath = `/tmp/reskin/${theme.name}.reskin`;
            const fileExists = await exists(filePath);
            // If it exists, set missing to the opposite of the exists(filePath) result (should be false)
            setMissing(!fileExists);
          } catch {
            // If it doesn't exist, set missing to true
            setMissing(true);
          }
        };
        checkFile();
      };
    }
  }, [theme.name]);

  // Return HTML content
  return (
    <div className="theme-card" onClick={onClick} style={{ cursor: "pointer", opacity: missing ? 0.5 : 1 }}>
      <img
        src={theme.preview}
        alt={theme.name || "Theme preview"}
        onError={e => { e.target.onerror = null; e.target.src = "/default-preview.png"; }}
        style={{ opacity: missing ? 0.5 : 1 }}
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

// Define default ThemeCard properties
ThemeCard.defaultProps = {
  theme: {
    preview: "https://upload.wikimedia.org/wikipedia/commons/4/47/React.svg",
    name: "Untitled Theme",
    author: "Unknown"
  }
};