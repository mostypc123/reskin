import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

import "./Settings.css";

export default function Settings() {
    const [installLocation, setInstallLocation] = useState(
        localStorage.getItem("reskin_install_location") || "~/.themes"
    );
    const [autoApply, setAutoApply] = useState(
        localStorage.getItem("reskin_auto_apply") === "true"
    );

    const [appVersion, setAppVersion] = useState("Unknown");
    const [fade, setFade] = useState(false);

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

    return (
        <div className={`settings-container${fade ? " settings-fade" : ""}`}>
            <h2>Settings</h2>
            <div className="settings-section">
                <h3>General</h3>
                <div className="settings-row">
                    <label htmlFor="installLocation">Theme Install Location:</label>
                    <input
                        id="installLocation"
                        type="text"
                        value={installLocation}
                        onChange={(e) => setInstallLocation(e.target.value)}
                    />
                </div>
                <div className="settings-row">
                    <label htmlFor="autoApply">Automatically apply theme after installation</label>
                    <input
                        id="autoApply"
                        type="checkbox"
                        checked={autoApply}
                        onChange={(e) => setAutoApply(e.target.checked)}
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
