import React, { useEffect, useState } from "react";
import "./Settings.css";

export default function Settings() {
    // Restore theme selection
    const [theme, setTheme] = useState(() => localStorage.getItem("reskin_theme") || "dark");
    const [installLocation, setInstallLocation] = useState(() => localStorage.getItem("reskin_install_location") || "~/.themes");
    const [appVersion, setAppVersion] = useState("");
    const [saveStatus, setSaveStatus] = useState("");

    useEffect(() => {
        // Apply theme class to body
        document.body.classList.remove("reskin-dark", "reskin-light");
        document.body.classList.add(`reskin-${theme}`);
        // Tauri API to get app version from backend
        const getVersion = async () => {
            try {
                if (window.__TAURI__ && window.__TAURI__.invoke) {
                    const ver = await window.__TAURI__.invoke("get_app_version");
                    setAppVersion(ver || "Unknown");
                } else {
                    setAppVersion("Unknown");
                }
            } catch {
                setAppVersion("Unknown");
            }
        };
        getVersion();
    }, []);

    // Persist theme selection
    useEffect(() => {
        localStorage.setItem("reskin_theme", theme);
        document.body.classList.remove("reskin-dark", "reskin-light");
        document.body.classList.add(`reskin-${theme}`);
    }, [theme]);

    const handleSave = () => {
        // Save theme and install location
        localStorage.setItem("reskin_theme", theme);
        localStorage.setItem("reskin_install_location", installLocation);
        setSaveStatus("Settings saved!");
        setTimeout(() => setSaveStatus(""), 2500);
    };

    return (
        <div className="settings-container">
            <h2>Settings</h2>
            <div className="settings-section">
                <h3>General</h3>
                <div className="settings-row">
                    <label htmlFor="theme">Theme:</label>
                    <select
                        id="theme"
                        value={theme}
                        onChange={e => setTheme(e.target.value)}
                    >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                    </select>
                </div>
                <div className="settings-row">
                    <label htmlFor="installLocation">Theme Install Location:</label>
                    <input
                        id="installLocation"
                        type="text"
                        value={installLocation}
                        onChange={e => setInstallLocation(e.target.value)}
                    />
                </div>
            </div>
            <div className="settings-section">
                <h3>About</h3>
                <div className="settings-row">
                    <span>App Version:</span>
                    <span>{appVersion || "Unknown"}</span>
                </div>
            </div>
            <button
                style={{ marginTop: 18, padding: "8px 24px", background: "#5f0d66", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
                onClick={handleSave}
            >
                Save
            </button>
            {saveStatus && (
                <div style={{ marginTop: 10, color: "#50fa7b", fontWeight: "bold", background: "#222", padding: "6px 16px", borderRadius: "6px" }}>
                    {saveStatus}
                </div>
            )}
        </div>
    );
}
