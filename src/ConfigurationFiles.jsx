import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./ConfigurationFiles.css";

const configMap = {
  gtk: "~/.config/gtk-3.0/settings.ini",
  kvantum: "~/.config/Kvantum/Kvantum.kvconfig",
  kitty: "~/.config/kitty/kitty.yml",
  waybar: "~/.config/waybar/config.jsonc",
  bashrc: "~/.bashrc",
  zshrc: "~/.zshrc",
  alacritty: "~/.config/alacritty/alacritty.yml",
  i3: "~/.config/i3/config",
  wofi: "~/.config/wofi/style.css",
};

export default function ConfigInstaller() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [configType, setConfigType] = useState("");
  const [status, setStatus] = useState("");

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setStatus("");
    }
  };

  const handleApply = async () => {
    if (!selectedFile || !configType) {
      setStatus("Please select a file and a config type!");
      return;
    }

    const destPath = configMap[configType];
    setStatus(`Applying ${selectedFile.name} → ${destPath} ...`);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const fileData = Array.from(new Uint8Array(arrayBuffer));

      await invoke("apply_config_file", {
        fileData,
        fileName: selectedFile.name,
        destPath
      });

      setStatus("Configuration applied successfully! ✅");
    } catch (err) {
      console.error(err);
      setStatus("Failed to apply configuration ❌");
    }
  };

  return (
    <div className={`reskin-${localStorage.getItem("reskin_theme") || "dark"}`}>
      <h1>🔧 Configuration Files</h1>

      {/* File Picker */}
      <input type="file" onChange={handleFileChange} />

      {/* Config Type Dropdown */}
      <select
        className="configType"
        value={configType}
        onChange={(e) => setConfigType(e.target.value)}
      >
        <option value="">Select config type</option>
        {Object.keys(configMap).map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      {/* Info Preview */}
      {selectedFile && configType && (
        <div style={{ marginTop: 16 }}>
          <p>File: {selectedFile.name}</p>
          <p>Type: {configType}</p>
          <p>Destination: {configMap[configType]}</p>
        </div>
      )}

      {/* Apply Button */}
      <button onClick={handleApply} style={{ marginTop: 16 }}>
        🎨 Apply Configuration
      </button>

      {/* Status */}
      {status && <p style={{ marginTop: 12 }}>{status}</p>}
    </div>
  );
}
