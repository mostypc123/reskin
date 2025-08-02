import React, { useEffect, useState } from "react";
import { invoke } from '@tauri-apps/api/core';


import "./Settings.css";

export default function Settings() {
    // Restore theme selection
    const [theme, setTheme] = useState(() => localStorage.getItem("reskin_theme") || "dark");
    const [installLocation, setInstallLocation] = useState(() => localStorage.getItem("reskin_install_location") || "~/.themes");
    const [appVersion, setAppVersion] = useState("");
    const [saveStatus, setSaveStatus] = useState("");

    // For smooth UI reload effect on theme change
    const [fade, setFade] = useState(false);

    useEffect(() => {
        // Apply theme class to body
        document.body.classList.remove("reskin-dark", "reskin-light");
        document.body.classList.add(`reskin-${theme}`);
        // Use Tauri's invoke API directly
        const getVersion = async () => {
            try {
                const ver = await invoke("get_app_version");
                setAppVersion(ver || "Unknown");
            } catch (err) {
                console.error("Failed to get app version:", err);
                setAppVersion(`Unknown (${err?.toString() || 'error'})`);
            }
        };
        getVersion();
        // Fade out/in for theme change
        setFade(true);
        const timer = setTimeout(() => setFade(false), 250);
        return () => clearTimeout(timer);
    }, []);

    // Persist theme selection
    useEffect(() => {
        localStorage.setItem("reskin_theme", theme);
        document.body.classList.remove("reskin-dark", "reskin-light");
        document.body.classList.add(`reskin-${theme}`);
    }, [theme]);

    // Save theme and install location immediately on change
    useEffect(() => {
        localStorage.setItem("reskin_theme", theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem("reskin_install_location", installLocation);
    }, [installLocation]);

    return (
        <div className={`settings-container${fade ? ' settings-fade' : ''}`}> 
            <h2>Settings</h2>
            <div className="settings-section">
                <h3>General</h3>
                <div className="settings-row">
                    <label htmlFor="theme">Theme:</label>
                    <select
                        id="theme"
                        value={theme}
                        onChange={e => setTheme(e.target.value)}
                        className={`settings-dropdown settings-dropdown-${theme}`}
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
            <div style={{textAlign: 'center', marginTop: '32px', fontSize: '1.05em', color: '#888'}}>
                Made with <span style={{color: '#e25555'}}>❤️</span> by NotMega
            </div>

        </div>
    );
}
