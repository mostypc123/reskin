// Import necessary components
import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Client, Databases, Account, ID } from "appwrite";

// Initialize Appwrite
const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject("reskin");
const databases = new Databases(client);
const account = new Account(client);

export default function ThemeDetails({ theme, onBack }) {
  const [manifest, setManifest] = useState(theme);
  const [isInstalled, setIsInstalled] = useState(false);
  // Define Appwrite credientials
  const databaseId = "reskin";
  const collectionId = "reports";

  useEffect(() => {
    async function checkIfInstalled() {
      // Get the current user's home directory
      const homeDir = `/home/${window.process?.env?.USER || 'user'}`;
      try {
        // Attempt to find the theme manifest
        const bundlePath = `${homeDir}/.themes/${theme.name}/reskin.json`;
        const realManifest = await invoke('extract_theme_info_from_file', { filePath: bundlePath });
        setManifest(realManifest);
        // Theme is installed
        setIsInstalled(true);
      } catch (err) {
        setManifest(theme);
        // Theme is not installed
        setIsInstalled(false);
      }
    }
    if (theme && theme.name) checkIfInstalled();
  }, [theme]);

  if (!manifest) return <div style={{ padding: 40 }}>Loading…</div>;

  // Handle applying the theme
  const handleApply = async () => {
    if (!manifest || !manifest.name) return;
    try {
      await invoke('apply_theme', { themeName: manifest.name });
    } catch (e) {
      console.error('Apply Theme error:', e);
    }
  };

  // Handle installing the theme
  const handleInstall = async () => {
  console.log('Attempting to download file with ID:', manifest.file);
  if (!manifest || !manifest.file) return;
  try {
    // Attempt to download the theme from the marketplace
    await invoke('download_theme', {
      themeFileId: manifest.file,
      themeName: manifest.name,
    });
    // If successful, set it as installed
    setIsInstalled(true);
    alert("Theme installed successfully!");
  } catch (e) {
    // Return error on failure
    console.error('Download Theme error:', e);
    alert("Failed to install theme.");
  }
};
  // Handle the button action of applying or installing the themes
  const handleButtonAction = isInstalled ? handleApply : handleInstall;

  // Get the current user from localStorage
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

  // Handle report functionality
  const handleReport = async () => {
    const reason = prompt("Please explain why you are reporting this theme:");
    if (!reason) return;

    try {
      // Get the current user ID, reported theme ID and the reason
      const user = await getUser();
      const reportData = {
        themeId: theme.$id || manifest.$id,
        reporterId: user?.$id || "anonymous",
        reason,
      };
      // Create a new document on the database with the report data
      await databases.createDocument(databaseId, collectionId, ID.unique(), reportData);
      alert("Report submitted successfully!");
    } catch (err) {
      // If unsuccessful, return an error
      console.error(err);
      alert("Failed to submit report.");
    }
  };

  let previewSrc = manifest.preview;

  // Return HTML content
  return (
    <div style={{ minHeight: "100vh", padding: "40px", fontFamily: "Inter, sans-serif" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", fontSize: "2rem", cursor: "pointer", marginBottom: "24px" }}>←</button>
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
          {manifest.name && <h1 style={{ margin: 0 }}>{manifest.name}</h1>}
          {manifest.author && <h2 style={{ margin: "8px 0 16px 0", fontWeight: 400 }}>by {manifest.author}</h2>}
          {manifest.description && <p style={{ maxWidth: "400px" }}>{manifest.description}</p>}
          <button
            style={{ marginTop: "18px", padding: "10px 24px", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "1rem", cursor: "pointer" }}
            onClick={handleButtonAction}
          >
            {isInstalled ? '🎨 Apply Theme' : '⬇️ Install Theme'}
          </button>
          <button
            style={{ marginTop: "12px", marginLeft: "12px", padding: "10px 24px", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "1rem", cursor: "pointer", backgroundColor: "#ff4d4f", color: "white" }}
            onClick={handleReport}
          >
            🚨 Report
          </button>
        </div>
      </div>
    </div>
  );
}