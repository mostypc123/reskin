import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./ThemeBundler.css";

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
    tags: ""
  });
  const [tags, setTags] = useState([]);
  const storedUser = JSON.parse(localStorage.getItem('reskin_user'));

  useEffect(() => {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setThemeData((prev) => ({ ...prev, [name]: value }));
    if (name === "name") setFormData((prev) => ({ ...prev, packageName: value }));
    else if (name === "author") setFormData((prev) => ({ ...prev, author: value }));
    else if (name === "description") setFormData((prev) => ({ ...prev, description: value }));
  };

  const handleTagsChange = (e) => {
    const value = e.target.value;
    if (value.endsWith(",")) {
      const newTag = value.slice(0, -1).trim();
      if (newTag && !tags.includes(newTag)) setTags([...tags, newTag]);
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
          setSelectedFolder({ name: entry.name, entry: entry });
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
      document.getElementById("folderInput").click();
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      const folderName = files[0].webkitRelativePath.split("/")[0];
      setSelectedFolder({ name: folderName, files: Array.from(files) });
      showStatus(`Selected folder: ${folderName}`, "success");
    }
  };

  const readDirectory = (entry) => {
    return new Promise((resolve) => {
      const allFiles = [];
      const readEntries = (dirEntry) => {
        const reader = dirEntry.createReader();
        reader.readEntries((entries) => {
          if (!entries.length) {
            resolve(allFiles);
            return;
          }
          const promises = entries.map((entry) => {
            return new Promise((entryResolve) => {
              if (entry.isFile) {
                entry.file((file) => {
                  allFiles.push({
                    path: entry.fullPath,
                    file: file,
                  });
                  entryResolve();
                });
              } else if (entry.isDirectory) {
                readEntries(entry);
                entryResolve();
              } else {
                entryResolve();
              }
            });
          });
          Promise.all(promises).then(() => readEntries(dirEntry));
        });
      };
      if (entry.isDirectory) {
        readEntries(entry);
      } else {
        resolve([]);
      }
    });
  };

  const handleBundle = async () => {
    if (!formData.packageName || (!formData.author && !storedUser.username) || !themeData.version) {
      showStatus("Please fill in Theme Name, Author, and Version!", "error");
      return;
    }
    if (!selectedFolder) {
      showStatus("Please select or drop a theme folder!", "error");
      return;
    }
    
    try {
      showStatus("Reading theme files...", "info");
      let totalSize = 0;
      let fileData = [];


    if (!selectedFolder.path) {
      fileData = selectedFolder.files ? selectedFolder.files : await readDirectory(selectedFolder.entry);
    }

      
      const manifest = {
        name: formData.packageName,
        author: storedUser?.username || formData.author || "User",
        description: formData.description,
        version: themeData.version || "1.0.0",
        tags: tags.join(","),
        license: formData.license || "MIT",
      };
      
      let homeDir = '';
      try {
        homeDir = await invoke('get_home_dir');
      } catch {
        homeDir = (window.__TAURI__ && window.__TAURI__.path && window.__TAURI__.path.homeDir) ? await window.__TAURI__.path.homeDir() : '/home/' + (window.process?.env?.USER || 'user');
      }
      
      const themeDir = `/tmp/reskin`;
      const outputPath = `${themeDir}/${formData.packageName}.reskin`;
      
      showStatus("Bundling theme from selected folder...", "info");
      
      const request = {
          manifest: manifest,
          theme_directory: selectedFolder.path,
          assets: fileData.map(f => f.path),
          output_path: outputPath,
      }

      let result;
      if (selectedFolder.path) {
        result = await invoke("bundle_theme", { request });
      } else {
        result = await invoke("bundle_theme_from_directory", { request });
      }

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

  const handleReskinFileChange = (e) => {
    setReskinFile(e.target.files[0] || null);
  };

  return (
    <div
      id="theme-bundler-root"
    >
      <h1>📦 Reskin Bundler</h1>

      <div className="themebundler-meta-row">
        <div className="themebundler-meta-col">
          <input
            name="name"
            placeholder="Theme Name"
            value={themeData.name}
            onChange={handleInputChange}
            required
            className="themebundler-input themebundler-input-name"
          />
          <input
            name="author"
            placeholder="Author"
            value={storedUser?.username || themeData.author || "User"}
            onChange={handleInputChange}
            required
            disabled={!!storedUser.username}
            className="themebundler-input"
          />
          <textarea
            name="description"
            placeholder="Description"
            value={themeData.description}
            onChange={handleInputChange}
            required
            className="themebundler-textarea"
          />
          <div className="themebundler-meta-flex">
            <input
            name="version"
            placeholder="Version"
            value={themeData.version}
            onChange={e => {
              const filtered = e.target.value.replace(/[^0-9.]/g, "");
              setThemeData(prev => ({ ...prev, version: filtered }));
            }}
            required
            className="themebundler-input themebundler-input-version"
            />

            <select
              name="license"
              value={themeData.license || "MIT"}
              onChange={handleInputChange}
              required
              className={`settings-dropdown`}
              style={{ color: "black" }}
            >
              <option value="">Select License</option>
              <option value="MIT">MIT</option>
              <option value="GPL-3.0">GPL-3.0</option>
              <option value="Apache-2.0">Apache-2.0</option>
              <option value="BSD-3-Clause">BSD-3-Clause</option>
            </select>
            <div className="themebundler-tags-flex">
              {tags.map(tag => (
              <span key={tag} className="themebundler-tag-chip">
                  {tag}
                <button type="button" onClick={() => removeTag(tag)} className="themebundler-tag-remove">×</button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Add tag, then comma"
                onChange={handleTagsChange}
                className="themebundler-tag-input"
              />
            </div>
          </div>
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFolderSelect}
        className={`themebundler-dropzone${dragOver ? " themebundler-dropzone-active" : ""}`}
      >
        {selectedFolder ? (
          <div>
            <p>📁 Selected: {selectedFolder.name}</p>
            <p className="themebundler-dropzone-desc">
              Drop another folder to replace or click to browse
            </p>
          </div>
        ) : (
          <div>
            <p>📁 Drag & Drop Theme Folder Here</p>
            <p className="themebundler-dropzone-desc">
              Or click to browse
            </p>
          </div>
        )}
      </div>

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
        className={`themebundler-bundle-btn${isReady && selectedFolder ? "" : " themebundler-bundle-btn-disabled"}`}
      >
        📦 Bundle .reskin
      </button>

      <div
        className="themebundler-status"
        style={{ color: getStatusColor() }}
      >
        {status}
      </div>
    </div>
  );
}