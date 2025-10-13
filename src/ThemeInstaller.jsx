// Import necessary components
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./ThemeInstaller.css";

export default function ThemeInstaller({ onThemeInstalled, setCurrentView }) {
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState("Loading Tauri API...");
  const [statusType, setStatusType] = useState("info");
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [themeInfo, setThemeInfo] = useState(null);

  useEffect(() => {
    // Check if Tauri API is available
    const checkTauri = () => {
      if (invoke) {
        setIsReady(true);
        setStatus("");
        setStatusType("info");
      } else {
        setTimeout(checkTauri, 100);
      }
    };
    checkTauri();
  }, []);

  // Show a status message
  const showStatus = (message, type = "info") => {
    setStatus(message);
    setStatusType(type);
  };

  // Handle dragging the folder over the area
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  // Handle dragging the folder outside of the area
  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  // Handle dropping the folder into the area
  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith(".reskin")) {
        await handleFileSelected(file);
      } else {
        // Show error if not a .reskin file
        showStatus("Please drop a .reskin file!", "error");
      }
    }
  };

  // Handle file selection
  const handleFileSelect = async () => {
    try {
      // Open file dialog to select .reskin file
      const filePath = await invoke("select_file", {
        title: "Select .reskin Theme File",
        filters: [
          {
            name: "Reskin Theme Files",
            extensions: ["reskin"],
          },
        ],
      });

      if (filePath) {
        setSelectedFile({ name: filePath.split("/").pop(), path: filePath });
        showStatus(`Selected file: ${filePath.split("/").pop()}`, "success");
        await loadThemeInfo(filePath);
      }
    } catch (error) {
      console.error("Error selecting file:", error);
      showStatus("File selection failed, using fallback...", "warning");
      // Fallback to file input
      document.getElementById("fileInput").click();
    }
  };

  // Function for when a new .reskin file is uploaded
  const handleFileInputChange = async (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith(".reskin")) {
        await handleFileSelected(file);
      } else {
        showStatus("Please select a .reskin file!", "error");
      }
    }
  };

  // Handle selection of the .reskin file
  const handleFileSelected = async (file) => {
    setSelectedFile({ name: file.name, file: file });
    showStatus(`Selected file: ${file.name}`, "success");
    console.log("Selected file:", file);

    // Try to extract theme info for preview
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const fileData = Array.from(uint8Array);

      const info = await invoke("extract_theme_info", {
        fileData: fileData,
      });
      // Set the extracted info as themeInfo
      setThemeInfo(info);
      showStatus("Theme info loaded successfully", "success");
    } catch (error) {
      // On failure, return an error
      console.error("Error loading theme info:", error);
      showStatus("Could not load theme preview", "warning");
    }
  };

  // Extract the theme info from a file
  const loadThemeInfo = async (filePath) => {
    try {
      const info = await invoke("extract_theme_info_from_file", {
        filePath: filePath,
      });
      // Set the extracted info as themeInfo
      setThemeInfo(info);
      showStatus("Theme info loaded successfully", "success");
    } catch (error) {
      // On failure, return an error
      console.error("Error loading theme info:", error);
      showStatus("Could not load theme preview", "warning");
    }
  };

// Handle installation of the .reskin file
const handleInstall = async () => {
  if (!selectedFile) {
    // If not a .reskin file, show an error
    showStatus("Please select a .reskin file!", "error");
    return;
  }

  try {
    showStatus("Installing theme...", "info");
    // If auto-apply is enabled, apply the theme automatically after it is installed
    const autoApply = localStorage.getItem("reskin_auto_apply") === "true";
    let result;

    if (selectedFile.path) {
      // Install directly from path
      result = await invoke("install_theme", {
        themePath: selectedFile.path,
        autoApply: autoApply,
      });
    } else if (selectedFile.file) {
      // Install from file data
      const arrayBuffer = await selectedFile.file.arrayBuffer();
      const fileData = Array.from(new Uint8Array(arrayBuffer));

      result = await invoke("install_theme_from_data", {
        fileData,
        fileName: selectedFile.name,
        autoApply: autoApply,
      });
    }
    // Return success
    console.log("Install result:", result);
    showStatus("Theme installed successfully!", "success");

    if (onThemeInstalled && themeInfo) {
      onThemeInstalled(themeInfo);
    }
  } catch (error) {
    // On failure, return an error
    console.error("Install error:", error);
    showStatus(`Installation failed: ${error.message || error}`, "error");
  }

  // Debug message for when install button is clicked
  console.log("Install button clicked");
};

  // Handle theme application
  const handleApply = async () => {
    if (!themeInfo) {
      showStatus("No theme loaded to apply!", "error");
      return;
    }
    console.log("Apply Theme button clicked");

    try {
      showStatus("Applying theme...", "info");
      // Invoke backend apply function
      const result = await invoke("apply_theme", {
        themeName: themeInfo.name,
      });
      // Return success
      console.log("Apply result:", result);
      showStatus("Theme applied successfully!", "success");
    } catch (error) {
      // On failure, return an error
      console.error("Apply error:", error);
      showStatus(`Failed to apply theme: ${error.message || error}`, "error");
    }
  };

  // Define status colors for all types of status messages
  const getStatusColor = () => {
    switch (statusType) {
      case "error":
        return "#ff5555";
      case "success":
        return "#50fa7b";
      case "warning":
        return "#ffb86c";
      default:
        return "#f8f8f2";
    }
  };

  // Return HTML content
  return (
    <div
      id="theme-installer-root"
      className={`reskin-${localStorage.getItem("reskin_theme") || "dark"}`}
    >
      <h1>🎨 Reskin Installer</h1>

      {/* Drag and Drop Area */}
      <div
        id="folder-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileSelect}
      >
        {selectedFile ? (
          <div>
            <p>📄 Selected: {selectedFile.name}</p>
            <p className="hint-text">
              Drop another .reskin file to replace or click to browse
            </p>
          </div>
        ) : (
          <div>
            <p>📄 Drag & Drop .reskin File Here</p>
            <p className="hint-text">
              Or click to browse
            </p>
          </div>
        )}
      </div>

      {/* Hidden file input for file selection fallback */}
      <input
        type="file"
        accept=".reskin"
        onChange={handleFileInputChange}
        id="fileInput"
      />

      {/* Theme Info Preview */}
      {themeInfo && (
        <div
          id="theme-info-preview"
        >
          <h3>📋 Theme Information</h3>
          <div id="theme-info">
            <p>
              <strong>Name:</strong> {themeInfo.name}
            </p>
            <p>
              <strong>Author:</strong> {themeInfo.author}
            </p>
            <p>
              <strong>Description:</strong> {themeInfo.description}
            </p>
            <p>
              <strong>Version:</strong> {themeInfo.version}
            </p>
            <p>
              <strong>Tags:</strong> {themeInfo.tags}
            </p>
            <p>
              <strong>License:</strong> {themeInfo.license}
            </p>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div id="install-button">
        <button
          onClick={handleInstall}
          disabled={!isReady || !selectedFile}
        >
          📥 Install Theme
        </button>
      </div>

      <div id="status" style={{ color: getStatusColor() }}
      >
        {status}
      </div>
    </div>
  );
}
