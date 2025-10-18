// Import necessary components
import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./Settings.css";
import { getTranslationObject, getLanguageOptions } from "./locales/index.js";

export default function Settings() {
    const [installLocation, setInstallLocation] = useState(
        localStorage.getItem("reskin_install_location") || "~/.themes"
    );
    const [autoApply, setAutoApply] = useState(
        localStorage.getItem("reskin_auto_apply") === "true"
    );
    const [backupConfig, setBackupConfig] = useState(
        localStorage.getItem("reskin_backup_config") === "true"
    );
    const [language, setLanguage] = useState(
        localStorage.getItem("reskin_language") || "en"
    );
    const [appVersion, setAppVersion] = useState("Unknown");
    const [fade, setFade] = useState(false);

    const t = getTranslationObject(language);
    const languageOptions = getLanguageOptions();

    useEffect(() => {
        const getVersion = async () => {
            try {
                const ver = await invoke("get_app_version");
                setAppVersion(ver || "Unknown");
            } catch (err) {
                console.error("Failed to get app version:", err);
                setAppVersion(`Unknown (${err?.toString() || "error"})`);
            }
        };
        getVersion();
    }, []);

    useEffect(() => {
        localStorage.setItem("reskin_install_location", installLocation);
    }, [installLocation]);

    useEffect(() => {
        localStorage.setItem("reskin_auto_apply", autoApply.toString());
    }, [autoApply]);

    useEffect(() => {
        localStorage.setItem("reskin_backup_config", backupConfig.toString());
    }, [backupConfig]);

    useEffect(() => {
        localStorage.setItem("reskin_language", language);
    }, [language]);

    return (
        <div className={`settings-container${fade ? " settings-fade" : ""}`}>
            <h2>{t.settings["title"]}</h2>
            <div className="settings-section">
                <h3>{t.settings.section["section.general"]}</h3>
                <div className="settings-row">
                    <label htmlFor="installLocation" title={t.settings.tooltip["tooltip.install_location"]}>
                        {t.settings.label["label.install_location"]}
                    </label>
                    <input
                        id="installLocation"
                        type="text"
                        value={installLocation}
                        onChange={(e) => setInstallLocation(e.target.value)}
                    />
                </div>
                <div className="settings-row">
                    <label htmlFor="autoApply" title={t.settings.tooltip["tooltip.auto_apply"]}>
                        {t.settings.label["label.auto_apply"]}
                    </label>
                    <input
                        id="autoApply"
                        type="checkbox"
                        checked={autoApply}
                        onChange={(e) => setAutoApply(e.target.checked)}
                    />
                </div>
                <div className="settings-row">
                    <label htmlFor="backupConfig" title={t.settings.tooltip["tooltip.backup_config"]}>
                        {t.settings.label["label.backup_config"]}
                    </label>
                    <input
                        id="backupConfig"
                        type="checkbox"
                        checked={backupConfig}
                        onChange={(e) => setBackupConfig(e.target.checked)}
                    />
                </div>
                <div className="settings-row">
                    <label htmlFor="language" title={t.settings.tooltip["tooltip.language"]}>
                        {t.settings.label["label.language"]}
                    </label>
                    <select
                        id="language"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        style={{ color: "black" }}
                    >
                        {languageOptions.map((opt) => (
                            <option key={opt.code} value={opt.code}>
                                {opt.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="settings-section">
                <h3>{t.settings.section["section.about"]}</h3>
                <div className="settings-row">
                    <span>{t.settings.label["label.app_version"]}</span>
                    <span>{appVersion || "Unknown"}</span>
                </div>
            </div>
            <div
                style={{
                    textAlign: "center",
                    marginTop: "32px",
                    fontSize: "1.05em",
                    color: "#888",
                }}
            >
                Made with <span style={{ color: "#e25555" }}>❤️</span> by NotMega
            </div>
        </div>
    );
}
