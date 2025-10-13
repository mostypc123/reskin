// Import necessary components
import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Client } from "appwrite";
import ThemeRow from "./ThemeRow";

// Download a .reskin file from the marketplace
const downloadTheme = async (args) => {
  return await invoke('download_theme', args);
}

// Fetch the list of marketplace themes from the server
const fetchMarketplaceThemes = async (args) => {
  return await invoke('fetch_marketplace_themes', args);
};

// Get metadata of a theme on the marketplace
const getThemeInfo = async (args) => {
  return await invoke('get_theme_info', args);
};

// Initialize Appwrite SDK
const client = new Client();
client
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("reskin");

export default function Marketplace({ onThemeClick, onNavigate }) {
  // Define the list of marketplace themes
  const [themes, setThemes] = useState(null);
  // Define Appwrite credientials
  const projectId = "reskin";
  const databaseId = "reskin";
  const collectionId = "themes";
  const apiKey = typeof import.meta.env.VITE_APPWRITE_apiKey === "string" && import.meta.env.VITE_APPWRITE_apiKey ? import.meta.env.VITE_APPWRITE_apiKey : "";
  const endpoint = typeof import.meta.env.VITE_APPWRITE_ENDPOINT === "string" && import.meta.env.VITE_APPWRITE_ENDPOINT ? import.meta.env.VITE_APPWRITE_ENDPOINT : "";

  useEffect(() => {
    const loadThemes = async () => {
      try {
        // Insert Appwrite credientials in the args array
        const args = {
          projectId,
          endpoint,
          databaseId,
          collectionId,
          apiKey
        };
        // Fetch all themes on the marketplace
        const data = await fetchMarketplaceThemes(args);
        console.log(data);
        // Set the result using a setter function
        setThemes(data.documents);
      } catch (error) {
        // Return error on failure
        console.error('Error fetching themes:', error);
      }
    };
    
    loadThemes();
  }, []);
  
  // Return HTML content
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