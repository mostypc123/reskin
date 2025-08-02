import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import React from "react";

export default function ThemeInstaller({ onThemeInstalled, setCurrentView }) {
	// Async function to run system shell command for theme install
	const runSystemInstall = async (themeName) => {
		try {
			// Get install location from localStorage or default
			let installLocation = localStorage.getItem("reskin_install_location") || "~/.themes";
			// Expand ~ to home dir if needed
			if (installLocation.startsWith("~")) {
				const homeDir = window.__TAURI__ ? await window.__TAURI__.invoke('get_home_dir') : '';
				installLocation = installLocation.replace("~", homeDir);
			}
			const copyCmd = `mkdir -p ${installLocation}/${themeName} && cp -r /tmp/reskin/${themeName}/* ${installLocation}/${themeName}/`;
			const { invoke } = window.__TAURI__.shell || {};
			if (invoke) {
				await invoke('run_shell_command', { command: copyCmd });
			} else {
				// Fallback: run via JS API if available
				await window.__TAURI__.invoke('run_shell_command', { command: copyCmd });
			}
			showStatus('Theme installed using system command!', 'success');
		} catch (err) {
			showStatus(`System install failed: ${err.message || err}`, 'error');
		}
	};
	const [isReady, setIsReady] = useState(false);
	const [status, setStatus] = useState('Loading Tauri API...');
	const [statusType, setStatusType] = useState('info');
	const [selectedFile, setSelectedFile] = useState(null);
	const [dragOver, setDragOver] = useState(false);
	const [themeInfo, setThemeInfo] = useState(null);

	useEffect(() => {
		// Check if Tauri API is available
		const checkTauri = () => {
			if (invoke) {
				setIsReady(true);
				setStatus('');
				setStatusType('info');
			} else {
				setTimeout(checkTauri, 100);
			}
		};
		checkTauri();
	}, []);

	const showStatus = (message, type = 'info') => {
		setStatus(message);
		setStatusType(type);
	};

	const handleDragOver = (e) => {
		e.preventDefault();
		setDragOver(true);
	};

	const handleDragLeave = (e) => {
		e.preventDefault();
		setDragOver(false);
	};

	const handleDrop = async (e) => {
		e.preventDefault();
		setDragOver(false);
		const files = e.dataTransfer.files;
		if (files.length > 0) {
			const file = files[0];
			if (file.name.endsWith('.reskin')) {
				await handleFileSelected(file);
			} else {
				showStatus('Please drop a .reskin file!', 'error');
			}
		}
	};

	const handleFileSelect = async () => {
		try {
			// Open file dialog to select .reskin file
			const filePath = await invoke('select_file', {
				title: 'Select .reskin Theme File',
				filters: [
					{
						name: 'Reskin Theme Files',
						extensions: ['reskin']
					}
				]
			});
			
			if (filePath) {
				setSelectedFile({ name: filePath.split('/').pop(), path: filePath });
				showStatus(`Selected file: ${filePath.split('/').pop()}`, 'success');
				await loadThemeInfo(filePath);
			}
		} catch (error) {
			console.error('Error selecting file:', error);
			showStatus('File selection failed, using fallback...', 'warning');
			// Fallback to file input
			document.getElementById('fileInput').click();
		}
	};

const handleFileInputChange = async (e) => {
	const files = e.target.files;
	if (files.length > 0) {
		const file = files[0];
		if (file.name.endsWith('.reskin')) {
			await handleFileSelected(file);
		} else {
			showStatus('Please select a .reskin file!', 'error');
		}
	}
};

	const handleFileSelected = async (file) => {
		setSelectedFile({ name: file.name, file: file });
		showStatus(`Selected file: ${file.name}`, 'success');
		console.log('Selected file:', file);
		
		// Try to extract theme info for preview
		try {
			const arrayBuffer = await file.arrayBuffer();
			const uint8Array = new Uint8Array(arrayBuffer);
			const fileData = Array.from(uint8Array);
			
			const info = await invoke('extract_theme_info', {
				fileData: fileData
			});
			
			setThemeInfo(info);
			showStatus('Theme info loaded successfully', 'success');
		} catch (error) {
			console.error('Error loading theme info:', error);
			showStatus('Could not load theme preview', 'warning');
		}
	};

	const loadThemeInfo = async (filePath) => {
		try {
			const info = await invoke('extract_theme_info_from_file', {
				filePath: filePath
			});
			
			setThemeInfo(info);
			showStatus('Theme info loaded successfully', 'success');
		} catch (error) {
			console.error('Error loading theme info:', error);
			showStatus('Could not load theme preview', 'warning');
		}
	};

  const handleInstall = async () => {
	if (!selectedFile) {
	  showStatus('Please select a .reskin file!', 'error');
	  return;
	}
	try {
	  showStatus('Installing theme...', 'info');
	  let themeName = '';
	  if (selectedFile.path) {
		showStatus('Reading theme info...', 'info');
		const fileThemeInfo = await invoke('extract_theme_info_from_file', {
		  filePath: selectedFile.path
		});
		themeName = fileThemeInfo.name;
		console.log('Theme info:', fileThemeInfo);
		showStatus('Extracting theme...', 'info');
		const extractResult = await invoke('extract_theme', {
		  bundlePath: selectedFile.path
		});
		console.log('Extract result:', extractResult);
		// Always copy extracted folder to ~/.themes/{themeName}
		const homeDir = await invoke('get_home_dir');
		const srcDir = `/tmp/reskin/${themeName}`;
		const destDir = `${homeDir}/.themes/${themeName}`;
		try {
		  await invoke('create_theme_dir', { path: destDir });
		} catch (e) {
		  console.error('create_theme_dir failed:', e);
		}
		try {
		  await invoke('copy_theme_dir', { src: srcDir, dest: destDir });
		  console.log('Copied theme to .themes:', destDir);
		} catch (e) {
		  console.error('copy_theme_dir failed:', e);
		  showStatus('Failed to copy theme to .themes. Check permissions.', 'error');
		}
		// Now install theme components
		const result = await invoke('install_theme', {
		  themeName: themeName
		});
		console.log('Install result:', result);
		showStatus('Theme installed successfully!', 'success');
		if (onThemeInstalled) {
		  onThemeInstalled(fileThemeInfo);
		}
	  } else if (selectedFile.file) {
		const arrayBuffer = await selectedFile.file.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer);
		const fileData = Array.from(uint8Array);
		// install_theme_from_data will extract and install, but we still copy to .themes for manifest
		const result = await invoke('install_theme_from_data', {
		  fileData: fileData,
		  fileName: selectedFile.name
		});
		console.log('Install result:', result);
		// Try to get theme name from result (if possible)
		let themeName = '';
		if (themeInfo && themeInfo.name) themeName = themeInfo.name;
		if (themeName) {
		  const homeDir = await invoke('get_home_dir');
		  const srcDir = `/tmp/reskin/${themeName}`;
		  const destDir = `${homeDir}/.themes/${themeName}`;
		  try {
			await invoke('create_theme_dir', { path: destDir });
		  } catch (e) {
			console.error('create_theme_dir failed:', e);
		  }
		  try {
			await invoke('copy_theme_dir', { src: srcDir, dest: destDir });
			console.log('Copied theme to .themes:', destDir);
		  } catch (e) {
			console.error('copy_theme_dir failed:', e);
			showStatus('Failed to copy theme to .themes. Check permissions.', 'error');
		  }
		}
		showStatus('Theme installed successfully!', 'success');
		if (onThemeInstalled) {
		  onThemeInstalled(themeInfo);
		}
	  }
	} catch (error) {
	  console.error('Install error:', error);
	  showStatus(`Installation failed: ${error.message || error}`, 'error');
	}
	console.log('Install button clicked');
  }

	const handleApply = async () => {
		if (!themeInfo) {
			showStatus('No theme loaded to apply!', 'error');
			return;
		}
	console.log('Apply Theme button clicked');

		try {
			showStatus('Applying theme...', 'info');
			
			const result = await invoke('apply_theme', {
				themeName: themeInfo.name
			});
			
			console.log('Apply result:', result);
			showStatus('Theme applied successfully!', 'success');
		} catch (error) {
			console.error('Apply error:', error);
			showStatus(`Failed to apply theme: ${error.message || error}`, 'error');
		}
	};

	const getStatusColor = () => {
		switch (statusType) {
			case 'error': return '#ff5555';
			case 'success': return '#50fa7b';
			case 'warning': return '#ffb86c';
			default: return '#f8f8f2';
		}
	};

	return (
		<div id="theme-installer-root" className={`reskin-${localStorage.getItem("reskin_theme") || "dark"}`}
			style={{
				fontFamily: 'sans-serif',
				maxWidth: '600px',
				margin: 'auto',
				padding: '2rem'
			}}>
			<h1>🎨 Reskin Installer</h1>

			{/* Drag and Drop Area */}
			<div
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onClick={handleFileSelect}
				style={{
					border: `2px dashed ${dragOver ? '#89b4fa' : '#555'}`,
					borderRadius: '8px',
					padding: '3rem',
					textAlign: 'center',
					background: dragOver ? '#2a2a3e' : '#2e2e3e',
					marginBottom: '1rem',
					cursor: 'pointer',
					transition: 'all 0.3s ease'
				}}
			>
				{selectedFile ? (
					<div>
						<p>📄 Selected: {selectedFile.name}</p>
						<p style={{ fontSize: '0.9rem', color: '#aaa' }}>Drop another .reskin file to replace or click to browse</p>
					</div>
				) : (
					<div>
						<p>📄 Drag & Drop .reskin File Here</p>
						<p style={{ fontSize: '0.9rem', color: '#aaa' }}>Or click to browse</p>
					</div>
				)}
			</div>

			{/* Hidden file input for file selection fallback */}
			<input
				type="file"
				accept=".reskin"
				onChange={handleFileInputChange}
				style={{ display: 'none' }}
				id="fileInput"
			/>

			{/* Theme Info Preview */}
			{themeInfo && (
				<div style={{
					background: '#2e2e3e',
					borderRadius: '8px',
					padding: '1rem',
					marginBottom: '1rem'
				}}>
					<h3>📋 Theme Information</h3>
					<div style={{ fontSize: '0.9rem' }}>
						<p><strong>Name:</strong> {themeInfo.name}</p>
						<p><strong>Author:</strong> {themeInfo.author}</p>
						<p><strong>Description:</strong> {themeInfo.description}</p>
						<p><strong>Version:</strong> {themeInfo.version}</p>
						{themeInfo.supports && (
							<p><strong>Supports:</strong> {themeInfo.supports.join(', ')}</p>
						)}
					</div>
				</div>
			)}

	  {/* Action Button */}
	  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
		<button
		  onClick={handleInstall}
		  disabled={!isReady || !selectedFile}
		  style={{
			flex: 1,
			padding: '0.6rem',
			fontSize: '1rem',
			border: 'none',
			borderRadius: '6px',
			background: (isReady && selectedFile) ? '#50fa7b' : '#555',
			color: '#000',
			cursor: (isReady && selectedFile) ? 'pointer' : 'not-allowed',
			fontWeight: 'bold'
		  }}
		>
		  📥 Install Theme
		</button>
	  </div>

			<div style={{
				marginTop: '1rem',
				padding: '0.5rem',
				borderRadius: '4px',
				background: '#2e2e3e',
				color: getStatusColor()
			}}>
				{status}
			</div>
		</div>
	);
}
