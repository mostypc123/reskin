import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import ThemeRow from "./ThemeRow";
import { getTranslationObject } from "./locales/index.js";

const downloadTheme = async (args) => await invoke('download_theme', args);
const fetchMarketplaceThemes = async (args) => await invoke('fetch_marketplace_themes', args);

export default function Marketplace({ onThemeClick, onNavigate }) {
  const language = localStorage.getItem("reskin_language") || "en";
  const t = getTranslationObject(language);

  const [themes, setThemes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadThemes = async () => {
      try {
        const args = {
          projectId: "reskin",
          endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || "",
          databaseId: "reskin",
          collectionId: "themes",
          apiKey: import.meta.env.VITE_APPWRITE_apiKey || ""
        };
        const data = await fetchMarketplaceThemes(args);
        setThemes(data.documents);
      } catch (error) {
        console.error(`${t.marketplace.status["loading"]} ${error}`);
      } finally {
        setLoading(false);
      }
    };

    loadThemes();
  }, [t]);

  return (
    <div className="marketplace">
      <button
        onClick={() => onNavigate("uploadtheme")}
        style={{
          padding: "10px 16px",
          borderRadius: 8,
          background: "#2a7cff",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          marginBottom: 16
        }}
      >
        {t.marketplace.button["upload"]}
      </button>

      {loading ? (
        <p>{t.marketplace.status["loading"]}</p>
      ) : (
        <ThemeRow
          title={t.marketplace.header["title"]}
          themes={themes || []}
          onThemeClick={onThemeClick}
        />
      )}
    </div>
  );
}
