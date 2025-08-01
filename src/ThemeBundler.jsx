import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function ThemeBundler() {
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState("Loading Tauri API...");
  const [statusType, setStatusType] = useState("info");
  const [formData, setFormData] = useState({
    packageName: "",
    author: "",
    description: "Created with Reskin",
  });
  const [dragOver, setDragOver] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [themeData, setThemeData] = useState({
    name: "",
    author: "",
    description: "",
    version: "",
    license: "",
    compat: "",
  });
  const [file, setFile] = useState(null);
  const [tags, setTags] = useState([]);
  const [reskinFile, setReskinFile] = useState(null);

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

  const showStatus = (message, type = "info") => {
    setStatus(message);
    setStatusType(type);
  };

  // Detect which desktop environments the theme supports based on folder structure
  const detectSupportedDesktops = (folder) => {
    if (!folder || !folder.files) return ["all"];

    const hasGTK = fileList.some((file) =>
      file.webkitRelativePath?.includes("gtk-2.0") ||
      file.webkitRelativePath?.includes("gtk-3.0") ||
      file.webkitRelativePath?.includes("gtk-4.0")
    );

    // Check for specific DE components
    const hasGnomeShell = fileList.some((file) =>
      file.webkitRelativePath?.includes("gnome-shell")
    );
    const hasXfwm4 = fileList.some((file) =>
      file.webkitRelativePath?.includes("xfwm4")
    );
    const hasCinnamon = fileList.some((file) =>
      file.webkitRelativePath?.includes("cinnamon")
    );
    const hasPlank = fileList.some((file) =>
      file.webkitRelativePath?.includes("plank")
    );
    const hasMetacity = fileList.some((file) =>
      file.webkitRelativePath?.includes("metacity-1")
    );
    const hasOpenbox = fileList.some((file) =>
      file.webkitRelativePath?.includes("openbox-3")
    );

    // Check for icons/cursors (universal)
    const hasIcons = fileList.some((file) =>
      file.webkitRelativePath?.includes("16x16") ||
      file.webkitRelativePath?.includes("22x22") ||
      file.webkitRelativePath?.includes("32x32") ||
      file.webkitRelativePath?.includes("48x48")
    );

    const hasCursors = fileList.some((file) =>
      file.webkitRelativePath?.includes("cursors")
    );

    // Add supported desktop environments
    if (hasGTK || hasMetacity) {
      supported.add("gnome");
      supported.add("mate");
      supported.add("unity");
    }

    if (hasXfwm4 || hasGTK) {
      supported.add("xfce");
    }

    if (hasGnomeShell) {
      supported.add("gnome");
    }

    if (hasCinnamon) {
      supported.add("cinnamon");
    }

    if (hasGTK) {
      supported.add("plasma"); // KDE can use GTK themes
    }

    if (hasOpenbox) {
      supported.add("openbox");
    }

    if (hasPlank) {
      supported.add("pantheon"); // Elementary OS uses Plank
    }

    // Icons and cursors work everywhere
    if (hasIcons || hasCursors) {
      supported.add("all");
    }

    // If we found specific components, return them, otherwise default to "all"
    return supported.size > 0 ? Array.from(supported) : ["all"];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setThemeData((prev) => ({ ...prev, [name]: value }));
    // Map Theme Name to packageName and Author to author in formData
    if (name === "name") {
      setFormData((prev) => ({ ...prev, packageName: value }));
    } else if (name === "author") {
      setFormData((prev) => ({ ...prev, author: value }));
    } else if (name === "description") {
      setFormData((prev) => ({ ...prev, description: value }));
    }
  };

  const handleTagsChange = (e) => {
    const value = e.target.value;
    if (value.endsWith(",")) {
      const newTag = value.slice(0, -1).trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      e.target.value = "";
    }
  };

  const removeTag = (tag) => setTags(tags.filter(t => t !== tag));

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const items = e.dataTransfer.items;
    if (items.length > 0) {
      const item = items[0];
      if (item.kind === "file") {
        const entry = item.webkitGetAsEntry();
        if (entry && entry.isDirectory) {
          setSelectedFolder(entry);
          showStatus(`Selected folder: ${entry.name}`, "success");
        } else {
          showStatus("Please drop a folder, not a file!", "error");
        }
      }
    }
  };

  const handleFolderSelect = async () => {
    try {
      const folderPath = await invoke("select_folder");
      const folderName = folderPath.split("/").pop();
      setSelectedFolder({ name: folderName, path: folderPath });
      showStatus(`Selected folder: ${folderName}`, "success");
    } catch (error) {
      console.error("Error selecting folder:", error);
      showStatus(`Folder selection failed: ${error}`, "error");
      // Fallback to file input
      document.getElementById("folderInput").click();
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      // Get the folder name from the first file's path
      const folderName = files[0].webkitRelativePath.split("/")[0];
      setSelectedFolder({ name: folderName, files: Array.from(files) });
      showStatus(`Selected folder: ${folderName}`, "success");
    }
  };

  const readDirectory = (entry) => {
    return new Promise((resolve) => {
      const files = [];

      const readEntries = (dirEntry) => {
        const reader = dirEntry.createReader();
        reader.readEntries((entries) => {
          entries.forEach((entry) => {
            if (entry.isFile) {
              entry.file((file) => {
                files.push({
                  path: entry.fullPath,
                  file: file,
                });
              });
            } else if (entry.isDirectory) {
              readEntries(entry);
            }
          });
        });
      };

      if (entry.isDirectory) {
        readEntries(entry);
        // Give it some time to read all files
        setTimeout(() => resolve(files), 1000);
      } else {
        resolve([]);
      }
    });
  };

  const handleBundle = async () => {
    // Use Node.js or Tauri API for home dir fallback
    let homeDir = '';
    try {
      homeDir = await invoke('get_home_dir');
    } catch {
      homeDir = (window.__TAURI__ && window.__TAURI__.path && window.__TAURI__.path.homeDir) ? await window.__TAURI__.path.homeDir() : '/home/' + (window.process?.env?.USER || 'user');
    }

    // Validate required fields
    if (!formData.packageName || !formData.author || !formData.description || !themeData.version || !themeData.license || tags.length === 0 || (!themeData.preview || (typeof themeData.preview !== 'string' && !themeData.preview.name))) {
      showStatus("Please fill in all required fields and add at least one tag!", "error");
      return;
    }

    // Calculate compat, size, updated
    let compatA = [];
    let totalSizeA = 0;
    let updatedA = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    if (selectedFolder && selectedFolder.files) {
      compatA = detectSupportedDesktops(selectedFolder.files);
      totalSizeA = selectedFolder.files.reduce((sum, file) => sum + file.size, 0);
    } else if (selectedFolder && selectedFolder.path) {
      compatA = ['all'];
    }

    const sizeStrA = totalSizeA ? `${(totalSizeA / (1024 * 1024)).toFixed(2)}MB` : "";
    let previewStr = '';
    if (typeof themeData.preview === 'string') {
      previewStr = themeData.preview;
    } else if (themeData.preview && themeData.preview.name) {
      previewStr = themeData.preview.name;
    }

    const manifestA = {
      name: formData.packageName,
      author: formData.author,
      description: formData.description,
      version: themeData.version,
      preview: previewStr,
      license: themeData.license,
      tags: tags,
      compat: compatA,
      size: sizeStrA,
      updated: updatedA,
    };

    // Bundle to /tmp first
    const tmpPath = `/tmp/reskin/${formData.packageName}.reskin`;
    const tmpExtractedDir = `/tmp/reskin/${formData.packageName}`;
    const themesDir = `${homeDir}/.themes/${formData.packageName}`;
    await invoke('create_theme_dir', { path: tmpExtractedDir });
    await invoke('create_theme_dir', { path: themesDir });
    // 1. Bundle .reskin in /tmp
    const resultA = await invoke("bundle_theme_from_directory", {
      manifest: manifestA,
      themeDirectory: selectedFolder.path,
      outputPath: tmpPath,
    });
    // 2. Extract .reskin in /tmp (using backend extraction)
    await invoke('extract_theme', { bundlePath: tmpPath });
    // 3. Copy extracted folder into ~/.themes
    await invoke('copy_theme_dir', { src: tmpExtractedDir, dest: themesDir });
    if (!formData.packageName || !formData.author) {
      showStatus("Please fill in Package Name and Author!", "error");
      return;
    }

    if (!selectedFolder) {
      showStatus("Please select or drop a theme folder!", "error");
      return;
    }

    // Calculate compat, size, updated
    let compat = [];
    let totalSize = 0;
    let updated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Detect compat from folder/files
    if (selectedFolder && selectedFolder.files) {
      compat = detectSupportedDesktops(selectedFolder.files);
      totalSize = selectedFolder.files.reduce((sum, file) => sum + file.size, 0);
    } else if (selectedFolder && selectedFolder.path) {
      // If using native dialog, fallback to 'all' and skip size
      compat = ['all'];
    }

    // Format size in MB
    const sizeStr = totalSize ? `${(totalSize / (1024 * 1024)).toFixed(2)}MB` : "";

    const manifest = {
      name: formData.packageName,
      author: formData.author,
      description: formData.description,
      version: themeData.version,
      preview: typeof themeData.preview === 'string' ? themeData.preview : '',
      license: themeData.license,
      tags: tags,
      compat: compat,
      size: sizeStr,
      updated: updated,
    };

    try {
      showStatus("Reading theme files...", "info");

      if (selectedFolder.path) {
        // Handle folder selected via native dialog
        showStatus("Bundling theme from selected folder...", "info");

        // Get home dir for .themes path
        const homeDir = await invoke('get_home_dir');
        const themeDir = `${homeDir}/.themes/${formData.packageName}`;
        const tmpPath = `/tmp/reskin/${formData.packageName}.reskin`;
        const outputPath = `${themeDir}/${formData.packageName}.reskin`;
        // Ensure .themes/{ThemeName} exists
        await invoke('create_theme_dir', { path: themeDir });
        // Bundle to /tmp first
        const result = await invoke("bundle_theme_from_directory", {
          manifest: manifest,
          themeDirectory: selectedFolder.path,
          outputPath: tmpPath,
        });
        // Extract .reskin file into ~/.themes/ThemeName/
        await invoke('extract_reskin_to_folder', {
          reskinPath: tmpPath,
          outputDir: themeDir,
        });

        console.log("Bundle result:", result);
        showStatus(
          `Theme bundled successfully! Saved to: /tmp/reskin/${formData.packageName}.reskin`,
          "success"
        );
        return;
      }

      // Handle file-based selection (fallback)
      let fileData = [];

      if (selectedFolder.files) {
        // Handle folder selected via input
        const fileReads = selectedFolder.files.map((file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const arrayBuffer = reader.result;
              const uint8Array = new Uint8Array(arrayBuffer);
              resolve({
                path: file.webkitRelativePath,
                data: Array.from(uint8Array),
              });
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
          })
        );
        fileData = await Promise.all(fileReads);
      } else {
        // Handle folder dropped via drag & drop
        const files = await readDirectory(selectedFolder);
        const fileReads = files.map(({ file, path }) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const arrayBuffer = reader.result;
              const uint8Array = new Uint8Array(arrayBuffer);
              resolve({
                path: path,
                data: Array.from(uint8Array),
              });
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
          })
        );
        fileData = await Promise.all(fileReads);
      }

      const homeDir = await invoke('get_home_dir');
      const themeDir = `${homeDir}/.themes/${formData.packageName}`;
      const outputPath = `${themeDir}/${formData.packageName}.reskin`;
      await invoke('create_theme_dir', { path: themeDir });

      console.log("Calling bundle_theme with", fileData.length, "files");
      showStatus("Bundling theme files...", "info");

      const result = await invoke("bundle_theme", {
        request: {
          manifest,
          output_path: outputPath,
          assets: fileData.map((f) => f.path),
          file_data: fileData,
          base_directory: null,
        },
      });

      console.log("Bundle result:", result);
      showStatus(`Theme bundled successfully! Saved to: ${outputPath}`, "success");
    } catch (error) {
      console.error("Bundle error:", error);
      showStatus(`Bundling failed: ${error.message || error}`, "error");
    }
  };

  const getStatusColor = () => {
    switch (statusType) {
      case "error":
        return "#ff5555";
      case "success":
        return "#50fa7b";
      default:
        return "#f8f8f2";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Your submit logic here
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + "MB";
      setThemeData(prev => ({ ...prev, size: sizeMB }));
    }
  };

  const handleReskinFileChange = (e) => {
    setReskinFile(e.target.files[0] || null);
  };

  const handleTagsSubmit = (e) => {
    e.preventDefault();
    // Compose manifest (do NOT set size or updated here)
    const manifest = {
      ...themeData,
      tags,
      compat: themeData.compat.split(",").map(c => c.trim()).filter(Boolean),
      // size and updated will be set in Rust after bundling
    };
    // TODO: Save manifest and files as needed
    alert("Manifest to bundle:\n" + JSON.stringify(manifest, null, 2));
  };

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        maxWidth: "700px",
        margin: "auto",
        padding: "2rem",
        background: "#1e1e2e",
        color: "#f5f5f5",
      }}
    >
      <h1>📦 Reskin Bundler</h1>

      {/* Theme meta info at the top */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        gap: "32px",
        alignItems: "flex-start",
        marginBottom: "2rem"
      }}>
        <div style={{ flex: 1 }}>
          <input
            name="name"
            placeholder="Theme Name"
            value={themeData.name}
            onChange={handleInputChange}
            required
            style={{
              width: "100%",
              marginBottom: "12px",
              padding: "12px",
              borderRadius: "4px",
              border: "none",
              background: "#333",
              color: "#fff",
              fontSize: "1.3rem",
              fontWeight: "bold"
            }}
          />
          <input
            name="author"
            placeholder="Author"
            value={themeData.author}
            onChange={handleInputChange}
            required
            style={{
              width: "100%",
              marginBottom: "12px",
              padding: "12px",
              borderRadius: "4px",
              border: "none",
              background: "#333",
              color: "#fff",
              fontSize: "1rem"
            }}
          />
          <textarea
            name="description"
            placeholder="Description"
            value={themeData.description}
            onChange={handleInputChange}
            required
            style={{
              width: "100%",
              marginBottom: "12px",
              padding: "12px",
              borderRadius: "4px",
              border: "none",
              background: "#333",
              color: "#fff",
              fontSize: "1rem",
              minHeight: "60px"
            }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
            <input
              name="version"
              placeholder="Version"
              value={themeData.version}
              onChange={handleInputChange}
              required
              style={{
                flex: "1 1 120px",
                padding: "8px",
                borderRadius: "4px",
                border: "none",
                background: "#333",
                color: "#fff",
                fontSize: "1rem"
              }}
            />
            <select
              name="license"
              value={themeData.license}
              onChange={handleInputChange}
              required
              style={{
                flex: "1 1 120px",
                padding: "8px",
                borderRadius: "4px",
                border: "none",
                background: "#fff",
                color: "#000",
                fontSize: "1rem"
              }}
            >
              <option value="">Select License</option>
              <option value="MIT">MIT</option>
              <option value="GPL-3.0">GPL-3.0</option>
              <option value="Apache-2.0">Apache-2.0</option>
              <option value="BSD-3-Clause">BSD-3-Clause</option>
              <option value="Unlicense">Unlicense</option>
            </select>
            {/* TAGS CHIP INPUT */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", background: "#333", borderRadius: "4px", padding: "8px", minWidth: "120px" }}>
              {tags.map(tag => (
                <span key={tag} style={{ background: "#444", borderRadius: "12px", padding: "4px 10px", color: "#fff", display: "flex", alignItems: "center" }}>
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} style={{ marginLeft: 6, background: "none", border: "none", color: "#fff", cursor: "pointer" }}>×</button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Add tag, then comma"
                onChange={handleTagsChange}
                style={{ background: "transparent", border: "none", color: "#fff", outline: "none", minWidth: 80 }}
              />
            </div>
            {/* Preview image file input */}
            <input
              type="file"
              accept="image/*"
              onChange={e => setThemeData(prev => ({ ...prev, preview: e.target.files[0] }))}
              style={{ flex: "2 1 180px", padding: "8px", borderRadius: "4px", border: "none", background: "#333", color: "#fff", fontSize: "1rem" }}
            />
          </div>
        </div>
      </div>

      {/* Drag and Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFolderSelect}
        style={{
          border: `2px dashed ${dragOver ? "#89b4fa" : "#555"}`,
          borderRadius: "8px",
          padding: "3rem",
          textAlign: "center",
          background: dragOver ? "#2a2a3e" : "#2e2e3e",
          marginBottom: "1rem",
          cursor: "pointer",
          transition: "all 0.3s ease",
        }}
      >
        {selectedFolder ? (
          <div>
            <p>📁 Selected: {selectedFolder.name}</p>
            <p
              style={{
                fontSize: "0.9rem",
                color: "#aaa",
              }}
            >
              Drop another folder to replace or click to browse
            </p>
          </div>
        ) : (
          <div>
            <p>📁 Drag & Drop Theme Folder Here</p>
            <p
              style={{
                fontSize: "0.9rem",
                color: "#aaa",
              }}
            >
              Or click to browse
            </p>
          </div>
        )}
      </div>

      {/* Hidden file input for folder selection fallback */}
      <input
        type="file"
        webkitdirectory
        directory
        onChange={handleFileInputChange}
        style={{ display: "none" }}
        id="folderInput"
      />

      <button
        onClick={handleBundle}
        disabled={!isReady || !selectedFolder}
        style={{
          display: "block",
          width: "100%",
          padding: "0.6rem",
          fontSize: "1rem",
          border: "none",
          borderRadius: "6px",
          background: isReady && selectedFolder ? "#89b4fa" : "#555",
          color: "#000",
          cursor: isReady && selectedFolder ? "pointer" : "not-allowed",
          fontWeight: "bold",
        }}
      >
        📦 Bundle .reskin
      </button>

      <div
        style={{
          marginTop: "1rem",
          padding: "0.5rem",
          borderRadius: "4px",
          background: "#2e2e3e",
          color: getStatusColor(),
        }}
      >
        {status}
      </div>
    </div>
  );
}
