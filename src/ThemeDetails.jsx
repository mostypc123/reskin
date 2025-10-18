// Import necessary components
import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Client, Databases, Account, ID } from "appwrite";
import { getTranslationObject } from "./locales/index.js";

// Initialize Appwrite
const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject("reskin");
const databases = new Databases(client);
const account = new Account(client);

export default function ThemeDetails({ theme, onBack }) {
  // Use stored language or fallback to English
  const language = localStorage.getItem("reskin_language") || "en";
  const t = getTranslationObject(language);

  const [manifest, setManifest] = useState(theme);
  const [isInstalled, setIsInstalled] = useState(false);
  const databaseId = "reskin";
  const collectionId = "reports";

  useEffect(() => {
    async function checkIfInstalled() {
      const homeDir = `/home/${window.process?.env?.USER || 'user'}`;
      try {
        const bundlePath = `${homeDir}/.themes/${theme.name}/reskin.json`;
        const realManifest = await invoke('extract_theme_info_from_file', { filePath: bundlePath });
        setManifest(realManifest);
        setIsInstalled(true);
      } catch {
        setManifest(theme);
        setIsInstalled(false);
      }
    }
    if (theme && theme.name) checkIfInstalled();
  }, [theme]);

  if (!manifest) return <div style={{ padding: 40 }}>{t.themedetails.status["loading"]}</div>;

  const handleApply = async () => {
    if (!manifest || !manifest.name) return;
    try {
      await invoke('apply_theme', { themeName: manifest.name });
    } catch (e) {
      console.error('Apply Theme error:', e);
    }
  };

  const handleInstall = async () => {
    if (!manifest || !manifest.file) return;
    try {
      await invoke('download_theme', {
        themeFileId: manifest.file,
        themeName: manifest.name,
      });
      setIsInstalled(true);
      alert(t.themedetails.status["install_success"]);
    } catch (e) {
      console.error('Download Theme error:', e);
      alert(t.themedetails.status["install_failure"]);
    }
  };

  const handleButtonAction = isInstalled ? handleApply : handleInstall;

  const getUser = async () => {
    let user = JSON.parse(localStorage.getItem("reskin_user"));
    if (user && user.$id) return user;
    try {
      user = await account.get();
      localStorage.setItem("reskin_user", JSON.stringify(user));
      return user;
    } catch {
      return null;
    }
  };

  const handleReport = async () => {
    const reason = prompt(t.themedetails.prompt["prompt.report_reason"]);
    if (!reason) return;

    try {
      const user = await getUser();
      const reportData = {
        themeId: theme.$id || manifest.$id,
        reporterId: user?.$id || "anonymous",
        reason,
      };
      await databases.createDocument(databaseId, collectionId, ID.unique(), reportData);
      alert(t.themedetails.status["report_submitted"]);
    } catch (err) {
      console.error(err);
      alert(t.themedetails.status["report_failure"]);
    }
  };

  const previewSrc = manifest.preview;

  return (
    <div style={{ minHeight: "100vh", padding: "40px", fontFamily: "Inter, sans-serif" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", fontSize: "2rem", cursor: "pointer", marginBottom: "24px" }}>←</button>
      <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
        <img
          src={previewSrc}
          alt={manifest.name || t.themedetails.fallback["fallback.preview_alt"]}
          style={{ width: "350px", height: "200px", borderRadius: "16px", objectFit: "cover" }}
          onError={e => {
            e.target.onerror = null;
            e.target.src = '/default-preview.png';
          }}
        />
        <div>
          {manifest.name && <h1 style={{ margin: 0 }}>{manifest.name}</h1>}
          {manifest.author && <h2 style={{ margin: "8px 0 16px 0", fontWeight: 400 }}>{t.themedetails.label["label.author_prefix"]} {manifest.author}</h2>}
          {manifest.description && <p style={{ maxWidth: "400px" }}>{manifest.description}</p>}
          <button
            style={{ marginTop: "18px", padding: "10px 24px", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "1rem", cursor: "pointer" }}
            onClick={handleButtonAction}
          >
            {isInstalled ? `🎨 ${t.themedetails.button["button.apply"]}` : `⬇️ ${t.themedetails.button["button.install"]}`}
          </button>
          <button
            style={{ marginTop: "12px", marginLeft: "12px", padding: "10px 24px", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "1rem", cursor: "pointer", backgroundColor: "#ff4d4f", color: "white" }}
            onClick={handleReport}
          >
            {t.themedetails.button["button.report"]}
          </button>
        </div>
      </div>
    </div>
  );
}
