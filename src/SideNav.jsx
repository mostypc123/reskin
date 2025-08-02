
import React, { useState } from "react";
import "./SideNav.css";

export default function ({ onNavigate }) {
	const [open, setOpen] = useState(false);
	const navs = [
		{ label: "Home", icon: "🏠", nav: "home" },
		{ label: "Theme Bundler", icon: "📦", nav: "bundler" },
		{ label: "Theme Installer", icon: "🎨", nav: "installer" },
		{ label: "Settings", icon: "⚙️", nav: "settings" }
	];

	return (
		<>
			<button
				className="hamburger-btn"
				onClick={() => setOpen(!open)}
				aria-label="Open navigation menu"
				style={{
					position: "absolute",
					top: 24,
					left: 24,
					zIndex: 2001,
					width: 48,
					height: 48,
					background: "rgba(40,40,40,0.9)",
					border: "none",
					borderRadius: "12px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					boxShadow: open ? "0 2px 16px rgba(0,0,0,0.2)" : "none",
					cursor: "pointer"
				}}
			>
				<span style={{ fontSize: 28, color: "#fff" }}>
					{open ? "✖" : "☰"}
				</span>
			</button>
			{open && (
				<div
					className="sidenav-overlay"
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						width: 340,
						height: "100vh",
						background: "rgba(24,24,24,0.98)",
						boxShadow: "2px 0 24px rgba(0,0,0,0.25)",
						zIndex: 2000,
						display: "flex",
						flexDirection: "column",
						padding: "32px 0 0 0"
					}}
				>
					<nav style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 32 }}>
						{navs.map((btn, idx) => (
							<button
								key={btn.nav}
								className="sidenav-menu-btn"
								style={{
									display: "flex",
									alignItems: "center",
									gap: 18,
									fontSize: "1.25rem",
									fontWeight: 500,
									background: idx === 0 ? "#fff" : "rgba(40,40,40,0.2)",
									color: idx === 0 ? "#222" : "#fff",
									border: "none",
									borderRadius: 24,
									padding: "12px 32px",
									margin: "0 24px",
									cursor: "pointer",
									boxShadow: idx === 0 ? "0 2px 8px rgba(0,0,0,0.08)" : "none"
								}}
								onClick={() => {
									setOpen(false);
									onNavigate && onNavigate(btn.nav);
								}}
							>
								<span style={{ fontSize: 22 }}>{btn.icon}</span>
								{btn.label}
							</button>
						))}
					</nav>
				</div>
			)}
		</>
	);
}