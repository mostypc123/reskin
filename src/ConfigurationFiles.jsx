// Import necessary components
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./ConfigurationFiles.css";

// Pre-defined config types
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
  hyprland: "~/.config/hypr/hyprland.conf",
  nvim: "~/.config/nvim/init.lua",
  vimrc: "~/.vimrc",
  fish: "~/.config/fish/config.fish"
};

export default function ConfigInstaller() {
  // Selected config file and type
  const [selectedFile, setSelectedFile] = useState(null);
  const [configType, setConfigType] = useState("");
  // Status message
  const [status, setStatus] = useState("");
  // Custom filename and location
  const [customPath, setCustomPath] = useState("");
  const [customName, setCustomName] = useState("");
  const [editingFile, setEditingFile] = useState(false);
  const [editingPath, setEditingPath] = useState(false);

  // If custom destination matches a pre-defined config type, select that type instead of 'custom'
  const getMatchingConfigType = (path, name) => {
    for (const [type, dest] of Object.entries(configMap)) {
      if (dest === `${path}/${name}`) return type;
    }
    return "custom";
  };

  // Function to handle file change
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setCustomName(e.target.files[0].name);
      setStatus("");
      setConfigType(""); // reset type
      setCustomPath(""); // reset path
    }
  };

  // Handle config file application
  const handleApply = async () => {
    // If there is no config file uploaded or type selected, throw an error
    if (!selectedFile || (!configType && !customPath)) {
      setStatus("Please select a file and a config type!");
      return;
    }

    // Use selected config type's filename and path or use user-defined values
    const destPath = (customPath && customName)
      ? `${customPath}/${customName}`
      : configMap[configType];

    // If backup config setting is enabled, invoke backend function to make a .bak file of the current config file
    const backupConfig = localStorage.getItem("reskin_backup_config");
    if (backupConfig) {
      try {
        await invoke("backup_config_file", { srcPath: destPath });
        console.log("Backup created successfully");
      } catch (err) {
        console.warn("Backup failed:", err);
        return;
      }
    }

    setStatus(`Applying ${selectedFile.name} → ${destPath} ...`);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const fileData = Array.from(new Uint8Array(arrayBuffer));
      
      // Invoke backend to apply the config file
      await invoke("apply_config_file", {
        fileData,
        fileName: selectedFile.name,
        destPath
      });

      setStatus("Configuration applied successfully! ✅");
    } catch (err) {
      // Throw an error on failure
      console.error(err);
      setStatus("Failed to apply configuration ❌");
    }
  };

  // Return HTML content
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
        <option value="custom">custom</option>
      </select>

      {/* Info Preview */}
      {selectedFile && (
        <div style={{ marginTop: 16 }}>
          {/* Filename */}
          <p>
            File:{" "}
            {editingFile ? (
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onBlur={() => {
                  setEditingFile(false);
                  setConfigType(getMatchingConfigType(customPath, customName));
                }}
                autoFocus
              />
            ) : (
              <>
                {customName}{" "}
                <button onClick={() => setEditingFile(true)}>✏️</button>
              </>
            )}
          </p>

          {/* Destination */}
          <p>
            Destination:{" "}
            {editingPath ? (
              <input
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                onBlur={() => {
                  setEditingPath(false);
                  setConfigType(getMatchingConfigType(customPath, customName));
                }}
                autoFocus
              />
            ) : (
              <>
                {customPath || (configType && configMap[configType])}{" "}
                <button onClick={() => setEditingPath(true)}>✏️</button>
              </>
            )}
          </p>
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
