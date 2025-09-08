import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Client } from "appwrite";
import ThemeRow from "./ThemeRow";

const downloadTheme = async (args) => {
  return await invoke('download_theme', args);
}

const fetchMarketplaceThemes = async (args) => {
  return await invoke('fetch_marketplace_themes', args);
};

const getThemeInfo = async (args) => {
  return await invoke('get_theme_info', args);
};

const client = new Client();
client
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("reskin");

export default function Marketplace({ onThemeClick, onNavigate }) {
  const [themes, setThemes] = useState(null);
  
  const projectId = "reskin";
  const databaseId = "reskin";
  const collectionId = "themes";
  const apiKey = typeof import.meta.env.VITE_APPWRITE_apiKey === "string" && import.meta.env.VITE_APPWRITE_apiKey ? import.meta.env.VITE_APPWRITE_apiKey : "";
  const endpoint = typeof import.meta.env.VITE_APPWRITE_ENDPOINT === "string" && import.meta.env.VITE_APPWRITE_ENDPOINT ? import.meta.env.VITE_APPWRITE_ENDPOINT : "";

  useEffect(() => {
    const loadThemes = async () => {
      try {
        const args = {
          projectId,
          endpoint,
          databaseId,
          collectionId,
          apiKey
        };
        const data = await fetchMarketplaceThemes(args);
        console.log(data);
        setThemes(data.documents);
      } catch (error) {
        console.error('Error fetching themes:', error);
      }
    };
    
    loadThemes();
  }, []);
  
  return (
    <>
      <button
        onClick={() => onNavigate("uploadtheme")}
      >
      Upload a Theme
      </button>
      {themes ? <ThemeRow title="Marketplace" themes={themes} onThemeClick={onThemeClick} /> : <p>Loading...</p>}
    </>
  );
}