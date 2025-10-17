// Import necessary components
import { useState } from "react";
import * as appwrite from "appwrite";

// Initialize Appwrite
const client = new appwrite.Client();
client
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("reskin");

// Define the current logged in user
const account = new appwrite.Account(client);

export default function PasswordReset() {
  const [email, setEmail] = useState(""); // Email for sending the password reset link
  const [loading, setLoading] = useState(false); // Loading state
  const [msg, setMsg] = useState(""); // Status message

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      // Create a recovery email and send it using the Appwrite SDK
      await account.createRecovery(
        email, 
        window.location.origin + "/set-new-password"
      );
      // Change status message to inform the user of the email being sent
      setMsg("Password reset email sent! Please check your inbox.");
    } catch (err) {
      // Change the status message to show the error on failure
      setMsg(err.message || "Failed to send password reset email.");
    }
    setLoading(false);
  };

  // Return HTML content
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#181818'
    }}>
      <div style={{
        background: '#222',
        borderRadius: 16,
        padding: 32,
        minWidth: 340,
        boxShadow: '0 4px 32px #0006',
        color: '#fff'
      }}>
        <h2 style={{ marginBottom: 18 }}>Reset Password</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ padding: 10, borderRadius: 8, border: '1px solid #444' }}
          />
          <button type="submit" disabled={loading} style={{
            padding: '12px 0',
            borderRadius: 8,
            background: '#2a7cff',
            color: '#fff',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer'
          }}>{loading ? "Sending..." : "Send password reset email"}</button>
        </form>
        {msg && <div style={{ marginTop: 16, color: msg.includes('sent') ? '#2a7cff' : '#e23c3c', fontWeight: 500 }}>{msg}</div>}
      </div>
    </div>
  );
}