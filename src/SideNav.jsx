
import { useEffect, useState } from "react";
import AuthModal from "./AuthModal";
import { Client, Account } from "appwrite";
import "./SideNav.css";


const client = new Client();
client.setEndpoint("https://cloud.appwrite.io/v1").setProject("reskin");
const account = new Account(client);

export default function ({ onNavigate, user, setUser }) {
  const [open, setOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const handleAuth = (userObj) => {
	setUser(userObj);
  };

  const handleLogout = async () => {
	try {
	  await account.deleteSession('current');
	} catch (err) {
	  console.error('Logout failed:', err);
	}
	setUser(null);
  };
	const navs = [
		{ label: "Home", icon: "🏠", nav: "home" },
		{ label: "Marketplace", icon: "🛒", nav: "marketplace" },
		{ label: "Theme Bundler", icon: "📦", nav: "bundler" },
		{ label: "Theme Installer", icon: "🎨", nav: "installer" },
		{ label: "Settings", icon: "⚙️", nav: "settings" },
	];

	return (
		<>
			{!open && (
				<button
					className="hamburger-btn"
					onClick={() => setOpen(true)}
					aria-label="Open navigation menu"
					style={{
						position: "absolute",
						top: 24,
						left: 32,
						zIndex: 2001,
						width: 48,
						height: 48,
						background: "rgba(40,40,40,0.9)",
						border: "none",
						borderRadius: "12px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						boxShadow: "none",
						cursor: "pointer"
					}}
				>
					<span style={{ fontSize: 28, color: "#fff" }}>
						☰
					</span>
				</button>
			)}
			{open && (
				<div
					className="sidenav-overlay"
					style={{
						position: "fixed",
						top: 0,
						left: 16,
						width: 340,
						height: "100vh",
						background: "rgba(24,24,24,0.98)",
						boxShadow: "2px 0 24px rgba(0,0,0,0.25)",
						zIndex: 2000,
						display: "flex",
						flexDirection: "column",
						padding: 0
					}}
				>
					{/* X button at top right of overlay */}
					<button
						aria-label="Close navigation menu"
						onClick={() => setOpen(false)}
						style={{
							position: 'absolute',
							top: 24,
							right: 24,
							width: 48,
							height: 48,
							background: 'rgba(40,40,40,0.9)',
							border: 'none',
							borderRadius: '12px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							zIndex: 2100,
							cursor: 'pointer'
						}}
					>
						<span style={{ fontSize: 28, color: '#fff' }}>✖</span>
					</button>
 {/* Login section at top */}
 <div style={{
   display: 'flex',
   alignItems: 'center',
   gap: 16,
   padding: '32px 24px 18px 24px',
   borderBottom: '1px solid #333',
   background: 'rgba(32,32,32,0.98)'
 }}>
   {user ? (
   <>
   </>
   ) : (
	 <button
	   onClick={() => setShowAuth(true)}
	   style={{
		 width: '100%',
		 padding: '14px 0',
		 fontSize: '1.1em',
		 fontWeight: 600,
		 color: '#fff',
		 background: '#2a7cff',
		 border: 'none',
		 borderRadius: 12,
		 cursor: 'pointer',
		 boxShadow: '0 2px 8px #0002'
	   }}
	 >
	   Log in
	 </button>
   )}
 </div>
 <AuthModal open={showAuth} onClose={() => setShowAuth(false)} onAuth={handleAuth} />
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
 {/* Log out button at bottom if logged in */}
 {user && (
   <button
	 onClick={handleLogout}
	 style={{
	   position: 'absolute',
	   left: 24,
	   bottom: 32,
	   width: 'calc(100% - 48px)',
	   padding: '14px 0',
	   fontSize: '1.08em',
	   fontWeight: 600,
	   color: '#fff',
	   background: '#e23c3c',
	   border: 'none',
	   borderRadius: 12,
	   cursor: 'pointer',
	   boxShadow: '0 2px 8px #0002'
	 }}
   >
	 Log out
   </button>
 )}
				</div>
			)}
		</>
	);
}