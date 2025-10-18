import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./ThemeInstaller.css";
import { getTranslationObject } from "./locales/index.js";

export default function ThemeInstaller({ onThemeInstalled }) {
  const language = localStorage.getItem("reskin_language") || "en";
  const t = getTranslationObject(language);

  const [selectedFile, setSelectedFile] = useState(null);
  const [themeInfo, setThemeInfo] = useState(null);
  const [status, setStatus] = useState(t.themeinstaller.status.loading_api);
  const [statusType, setStatusType] = useState("info");
  const [dragOver, setDragOver] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const showStatus = (msg, type = "info") => {
    setStatus(msg);
    setStatusType(type);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragOver(false); };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length && files[0].name.endsWith(".reskin")) {
      await handleFileSelected(files[0]);
    } else {
      showStatus(t.themeinstaller.status.error_not_reskin, "error");
    }
  };

  const handleFileSelected = async (file) => {
    setSelectedFile(file);
    showStatus(t.themeinstaller.status.success_select.replace("{filePath}", file.name), "success");

    // Load theme info
    try {
      const arrayBuffer = await file.arrayBuffer();
      const text = new TextDecoder().decode(arrayBuffer);
      const json = JSON.parse(text);
      setThemeInfo(json);
      showStatus(t.themeinstaller.status.info_loaded, "success");
    } catch (err) {
      showStatus(t.themeinstaller.status.error_info_load, "error");
    }
  };

  const handleInstall = async () => {
    if (!selectedFile) return showStatus(t.themeinstaller.status.error_no_theme_to_apply, "error");
    setIsInstalling(true);
    showStatus(t.themeinstaller.status.installing, "info");

    try {
      await invoke("install_reskin_theme", { filePath: selectedFile.path });
      showStatus(t.themeinstaller.status.install_success, "success");
      onThemeInstalled && onThemeInstalled(selectedFile);
    } catch (err) {
      showStatus(t.themeinstaller.status.install_failure.replace("{error.message || error}", err.message || err), "error");
    }

    setIsInstalling(false);
  };

  return (
    <div
      className={`theme-installer ${dragOver ? "drag-over" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="dropzone">
        {selectedFile ? t.themeinstaller.dragdrop.selected_title.replace("{selectedFile.name}", selectedFile.name) : t.themeinstaller.dragdrop.default_title}
      </div>
      {themeInfo && (
        <div className="theme-info">
          <div>{t.themeinstaller.info_preview.header}</div>
          <div>{t.themeinstaller.info_preview.name} {themeInfo.name}</div>
          <div>{t.themeinstaller.info_preview.author} {themeInfo.author}</div>
          <div>{t.themeinstaller.info_preview.description} {themeInfo.description}</div>
          <div>{t.themeinstaller.info_preview.version} {themeInfo.version}</div>
          <div>{t.themeinstaller.info_preview.tags} {themeInfo.tags?.join(", ")}</div>
          <div>{t.themeinstaller.info_preview.license} {themeInfo.license}</div>
        </div>
      )}
      <button onClick={handleInstall} disabled={isInstalling}>
        {t.themeinstaller.button.install}
      </button>
      <div className={`status ${statusType}`}>{status}</div>
    </div>
  );
}
