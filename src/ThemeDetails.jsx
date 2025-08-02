import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function ThemeDetails({ theme, onBack }) {
  const [manifest, setManifest] = useState(theme);

  useEffect(() => {
    async function fetchManifest() {
      let homeDir = '';
      try {
        homeDir = await invoke('get_home_dir');
      } catch (e) {
        console.error('get_home_dir failed:', e);
        homeDir = (window.__TAURI__ && window.__TAURI__.path && window.__TAURI__.path.homeDir) ? await window.__TAURI__.path.homeDir() : '/home/' + (window.process?.env?.USER || 'user');
      }
      try {
        const bundlePath = `${homeDir}/.themes/${theme.name}/${theme.name}.reskin`;
        console.log('Trying to extract manifest from', bundlePath);
        const realManifest = await invoke('extract_theme_info_from_file', { filePath: bundlePath });
        setManifest(realManifest);
        console.log('Loaded manifest:', realManifest);
      } catch (err) {
        console.error('extract_theme_info_from_file failed:', err);
        setManifest(theme);
      }
    }
    if (theme && theme.name) fetchManifest();
  }, [theme]);


  if (!manifest) {
    return <div style={{ padding: 40 }}>Loading…</div>;
  }

  // Handler to apply the theme
  const handleApply = async () => {
    if (!manifest || !manifest.name) {
      console.log('Apply Theme: manifest missing or name missing', manifest);
      return;
    }
    try {
      console.log('Apply Theme button clicked for', manifest.name);
      await invoke('apply_theme', { themeName: manifest.name });
      console.log('Theme applied:', manifest.name);
      // Optionally show a status message or notification
    } catch (e) {
      console.error('Apply Theme error:', e);
      // Optionally show error
    }
  };

  // Defensive preview image handling
  let previewSrc = manifest.preview;
  if (!previewSrc || typeof previewSrc !== 'string' || previewSrc.trim() === '') {
    previewSrc = 'https://cdn.builder.io/api/v1/image/assets/TEMP/9659e8886b77aefaa21fe2f49c72ea8585af01f9?placeholderIfAbsent=true';
  }

  return (
    <div style={{ minHeight: "100vh", padding: "40px", fontFamily: "Inter, sans-serif" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", fontSize: "2rem", cursor: "pointer", marginBottom: "24px" }}>
        ←
      </button>
      <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
        <img
          src={previewSrc}
          alt={manifest.name || 'Theme preview'}
          style={{ width: "350px", height: "200px", borderRadius: "16px", objectFit: "cover" }}
          onError={e => {
            e.target.onerror = null;
            e.target.src = 'https://cdn.builder.io/api/v1/image/assets/TEMP/9659e8886b77aefaa21fe2f49c72ea8585af01f9?placeholderIfAbsent=true';
          }}
        />
        <div>
          {manifest.name && (
            <h1 style={{ margin: 0 }}>{manifest.name}</h1>
          )}
          {manifest.author && (
            <h2 style={{ margin: "8px 0 16px 0", fontWeight: 400 }}>
              by {manifest.author}
            </h2>
          )}
          {manifest.description && (
            <p style={{ maxWidth: "400px" }}>{manifest.description}</p>
          )}
          <button
            style={{ marginTop: "18px", padding: "10px 24px", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "1rem", cursor: "pointer" }}
            onClick={handleApply}
          >
            🎨 Apply Theme
          </button>
        </div>
      </div>
    </div>
  );
}