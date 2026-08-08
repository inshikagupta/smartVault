import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { resetPassword as resetPasswordRequest } from "../services/auth.service";

export default function ResetPassword() {

  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
            setError("Invalid password reset link.");
            return;
        }

        // Check password length
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }


    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const resp = await resetPasswordRequest({ 
        token, 
        password 
    });

      setMessage(resp.message || "Password reset successfully.");

       // Redirect after success
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Reset Password</h1>
        <p style={styles.subtitle}>Enter a new password to continue.</p>

        {message && <div style={styles.success}>{message}</div>}
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>New password</label>
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Confirm password</label>
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? "Resetting…" : "Reset password"}
          </button>
        </form>

        <div style={styles.footer}>
          Already have an account? <Link to="/" style={styles.link}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8f9fa",
    fontFamily: "'Google Sans', sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 2px 12px rgba(0,0,0,.08)",
  },
  title: { fontSize: 24, fontWeight: 600, color: "#202124", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#5f6368", marginBottom: 24 },
  error: {
    background: "#fce8e6",
    color: "#d93025",
    fontSize: 14,
    padding: "12px 16px",
    borderRadius: 8,
    marginBottom: 20,
  },
  success: {
    background: "#e6f4ea",
    color: "#188038",
    fontSize: 14,
    padding: "12px 16px",
    borderRadius: 8,
    marginBottom: 20,
    lineHeight: 1.4,
  },
  form: { display: "flex", flexDirection: "column", gap: 18 },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 13, fontWeight: 500, color: "#3c4043" },
  input: {
    border: "1px solid #dadce0",
    borderRadius: 8,
    padding: "14px 16px",
    fontSize: 15,
    color: "#202124",
    outline: "none",
    fontFamily: "inherit",
  },
  btn: {
    background: "#1a73e8",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "13px 24px",
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
    transition: "background .2s",
  },
  footer: { marginTop: 22, fontSize: 14, color: "#5f6368" },
  link: { color: "#1a73e8", textDecoration: "none", fontWeight: 500 },
};
