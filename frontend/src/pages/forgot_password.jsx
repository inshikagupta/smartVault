import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
    forgotPassword as forgotPasswordRequest
} from "../services/auth.service";

export default function ForgotPassword() {

    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [resetLink, setResetLink] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setMessage("");
        setResetLink("");

        if (!email.trim()) {
            setError("Please enter your email.");
            return;
        }

        try {

            setLoading(true);

            const res = await forgotPasswordRequest({
                email: email.trim()
            });

            setMessage(
                res.message ||
                "If that email is registered, a reset link has been sent."
            );

            if (res.resetLink) {
                setResetLink(res.resetLink);
            }

        } catch (err) {

            console.error("Forgot password error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to send reset link. Please try again."
            );

        } finally {

            setLoading(false);

        }
    };

    return (
        <div style={styles.page}>

            <div style={styles.card}>

                <h1 style={styles.title}>
                    Forgot password?
                </h1>

                <p style={styles.subtitle}>
                    Enter your email address and we'll send you
                    a link to reset your password.
                </p>

               
                {message && (
                    <div style={styles.success}>
                        {message}
                    </div>
                )}

                {/* {resetLink && (
                    <div style={styles.resetLink}>
                        <p style={{ margin: 0, fontWeight: 600 }}>Development reset link:</p>
                        <a href={resetLink} target="_blank" rel="noreferrer">
                            {resetLink}
                        </a>
                    </div>
                )} */}

                {/* Error message */}
                {error && (
                    <div style={styles.error}>
                        {error}
                    </div>
                )}

                {!message && (
                    <form
                        onSubmit={handleSubmit}
                        style={styles.form}
                    >

                        <div style={styles.field}>

                            <label style={styles.label}>
                                Email
                            </label>

                            <input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                required
                                disabled={loading}
                                style={styles.input}
                            />

                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                ...styles.btn,
                                opacity: loading ? 0.7 : 1,
                                cursor: loading
                                    ? "not-allowed"
                                    : "pointer",
                            }}
                        >
                            {loading
                                ? "Sending..."
                                : "Send reset link"}
                        </button>

                    </form>
                )}

                <div style={styles.footer}>

                    Remember your password?{" "}

                    <Link
                        to="/"
                        style={styles.link}
                    >
                        Sign in
                    </Link>

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
        padding: "20px",
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

    title: {
        fontSize: 26,
        fontWeight: 600,
        color: "#202124",
        margin: 0,
        marginBottom: 8,
    },

    subtitle: {
        fontSize: 15,
        color: "#5f6368",
        margin: 0,
        marginBottom: 24,
        lineHeight: 1.5,
    },

    error: {
        background: "#fce8e6",
        color: "#d93025",
        fontSize: 14,
        padding: "12px 16px",
        borderRadius: 8,
        marginBottom: 20,
        lineHeight: 1.4,
    },
    resetLink: {
        background: "#eef7ff",
        border: "1px solid #cfe3ff",
        color: "#1a73e8",
        fontSize: 14,
        padding: "14px 16px",
        borderRadius: 8,
        marginBottom: 20,
        lineHeight: 1.5,
        wordBreak: "break-all",
    },
    success: {
        background: "#e6f4ea",
        color: "#188038",
        fontSize: 14,
        padding: "12px 16px",
        borderRadius: 8,
        marginBottom: 20,
        lineHeight: 1.5,
    },

    form: {
        display: "flex",
        flexDirection: "column",
        gap: 20,
    },

    field: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },

    label: {
        fontSize: 14,
        fontWeight: 500,
        color: "#3c4043",
    },

    input: {
        border: "1px solid #dadce0",
        borderRadius: 8,
        padding: "13px 14px",
        fontSize: 15,
        color: "#202124",
        outline: "none",
        fontFamily: "inherit",
        boxSizing: "border-box",
        width: "100%",
    },

    btn: {
        width: "100%",
        background: "#1a73e8",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "13px 24px",
        fontSize: 15,
        fontWeight: 500,
        transition: "opacity .2s",
    },

    footer: {
        marginTop: 24,
        fontSize: 14,
        color: "#5f6368",
        textAlign: "center",
    },

    link: {
        color: "#1a73e8",
        textDecoration: "none",
        fontWeight: 500,
    },
};