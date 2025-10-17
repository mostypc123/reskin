// Import necessary components
import React, { useState } from "react";
import { ID,  Client, Account } from "appwrite";
console.log('Appwrite imports:', { Client, Account });
import "./AuthModal.css";

// Define server credientials
const client = new Client();
client
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("reskin");

let account;
// Attempt to initialize Appwrite
try {
  account = new Account(client);
  console.log('Appwrite initialized:', { client, account });
} catch (e) {
  console.error('Error initializing Appwrite:', e);
}

export default function AuthModal({ open, onClose, onAuth }) {
  const [mode, setMode] = useState("login"); // Set the state of the AuthModal ("login" or "signup")
  // Define user credientials with a setter function, leave initial state blank
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  // Define user-facing elements (loading state, recovery/password reset) which are off by default
  const [loading, setLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  // Define recovery email and recovery state for password reset
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryMsg, setRecoveryMsg] = useState("");

  // On startup, check for active session and fetch user info
  React.useEffect(() => {
    (async () => {
      try {
        // If session exists, get user info
        const user = await account.get();
        if (user) {
          onAuth && onAuth(user);
        }
      } catch (err) {
        // No active session
      }
    })();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Allow only login with email address (Appwrite SDK limitation)
      if (!email.includes('@')) {
        throw new Error('Please enter your email address to log in.');
      }
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      const fullUser = await account.get();
      const userData = {
        id: fullUser.$id,
        email: fullUser.email,
        username: fullUser.name || fullUser.username || (fullUser.prefs && fullUser.prefs.username) || fullUser.email.split('@')[0],
        prefs: fullUser.prefs || {},
      };
      onAuth(userData);
      // On successful login, store current user in localStorage
      localStorage.setItem('reskin_user', JSON.stringify(userData));
      onClose();
    } catch (err) {
      // Return error message upon a failed login attempt
      console.error(err);
      console.error(err.stack)
      setError(err.message || "Login failed");
    }
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await account.create(ID.unique(), email, password, username);
      // Log in automatically after signing up
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      // Fetch latest user data from the server
      const fullUser = await account.get();
      const userData = {
        id: fullUser.$id,
        email: fullUser.email,
        username: fullUser.name || fullUser.username || (fullUser.prefs && fullUser.prefs.username) || fullUser.email.split('@')[0],
        prefs: fullUser.prefs || {},
      };
      onAuth(userData);
      // On successful signup, store current user in localStorage
      localStorage.setItem('reskin_user', JSON.stringify(userData));
      onClose();
    } catch (err) {
      setError(err.message || "Signup failed");
    }
    setLoading(false);
  };

  // Handle password reset/recovery
  const handleRecovery = async (e) => {
    e.preventDefault();
    setRecoveryMsg("");
    setLoading(true);
    try {
      await account.createRecovery(recoveryEmail, window.location.origin + "/set-new-password");
      setRecoveryMsg("Password reset email sent! Check your inbox.");
    } catch (err) {
      setRecoveryMsg(err.message || "Failed to send recovery email.");
    }
    setLoading(false);
  };

  if (!open) return null;

  // Return HTML elements
  return (
    <div className="auth-modal-overlay" style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.5)",
      zIndex: 3000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div className="auth-modal-content" style={{
        background: "var(--color-bg-dark)",
        color: "var(--color-text-dark)",
        borderRadius: 16,
        padding: 32,
        minWidth: 340,
        boxShadow: "0 4px 32px #0006",
        position: "relative"
      }}>
        <button onClick={onClose} style={{ 
          position: "absolute", 
          top: 24, 
          right: 24, 
          background: "none", 
          border: "none", 
          color: "var(--color-text-dark)", 
          fontSize: 24, 
          cursor: "pointer" 
        }}>✖</button>
        <h2 style={{ color: "var(--color-text-dark)", marginBottom: 18 }}>{showRecovery ? "Reset password" : (mode === "login" ? "Log in" : "Sign up")}</h2>
        <p>By creating or using a Reskin account, you agree to our Terms of Service and Privacy Policy.</p>
        {!showRecovery ? (
          <>
            <form onSubmit={mode === "login" ? handleLogin : handleSignup} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input
            type="email"
            placeholder={mode === "login"
              ? "Email (required for login)"
              : "Email (required, used for login & password reset)"}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          )}
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              {error && <div style={{ color: "#e23c3c", fontWeight: 500 }}>{error}</div>}
              <button type="submit" disabled={loading} style={{
                padding: "12px 0",
                borderRadius: 8,
                background: "#2a7cff",
                color: "#fff",
                fontWeight: 600,
                border: "none",
                cursor: "pointer"
              }}>{loading ? (mode === "login" ? "Logging in..." : "Signing up...") : (mode === "login" ? "Log in" : "Sign up")}</button>
            </form>
            <div style={{ marginTop: 18, color: "#bbb", fontSize: "0.98em" }}>
              {mode === "login" ? (
                <>
                  Don't have an account? <button style={{ color: "#2a7cff", background: "none", border: "none", cursor: "pointer" }} onClick={() => setMode("signup")}>Sign up</button><br />
                  <button style={{ color: "#2a7cff", background: "none", border: "none", cursor: "pointer", marginTop: 8 }} onClick={() => setShowRecovery(true)}>Forgot password?</button>
                </>
              ) : (
                <>Already have an account? <button style={{ color: "#2a7cff", background: "none", border: "none", cursor: "pointer" }} onClick={() => setMode("login")}>Log in</button></>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleRecovery} style={{ color: "white", display: "flex", flexDirection: "column", gap: 16 }}>
            <input
              type="email"
              placeholder="Enter your account email"
              value={recoveryEmail}
              onChange={e => setRecoveryEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={loading} style={{
              padding: "12px 0",
              borderRadius: 8,
              background: "#2a7cff",
              color: "#fff",
              fontWeight: 600,
              border: "none",
              cursor: "pointer"
            }}>{loading ? "Sending..." : "Send password reset email"}</button>
            {recoveryMsg && <div style={{ color: recoveryMsg.includes('sent') ? '#2a7cff' : '#e23c3c', fontWeight: 500 }}>{recoveryMsg}</div>}
            <button type="button" style={{ color: "#bbb", background: "none", border: "none", cursor: "pointer", marginTop: 8 }} onClick={() => setShowRecovery(false)}>Back to login</button>
          </form>
        )}
      </div>
    </div>
  );
}
