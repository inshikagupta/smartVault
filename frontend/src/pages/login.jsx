import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/auth.service";
// import { useAuth } from "../App";

export default function Login() {
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    // const { setUser } = useAuth();
    const navigate = useNavigate();

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const data = await loginUser(form);
            // setUser(data.user);
            console.log("LOGIN SUCCESS", data);
            localStorage.setItem(
            "user",
            JSON.stringify(data.user)
            );
            navigate("/dashboard");
        } catch (err) {
            console.log(err.response?.data);

            setError(err.response?.data?.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                {/* Logo */}
                <div style={styles.logoRow}>
                    <svg width="40" height="40" viewBox="0 0 48 48">
                        <path fill="#4285F4" d="M6 30l6-10.4 6 10.4z"/>
                        <path fill="#EA4335" d="M18 30l6-10.4L30 30z"/>
                        <path fill="#FBBC04" d="M30 30l6-10.4L42 30z"/>
                    </svg>
                    <span style={styles.logoText}>SmartVault</span>
                </div>
                <h1 style={styles.title}>Sign in</h1>
                <p style={styles.subtitle}>Use your SmartVault account</p>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.field}>
                        <label style={styles.label}>Email address</label>
                        <input
                            type="email" name="email" value={form.email}
                            onChange={handleChange} required
                            style={styles.input}
                            placeholder="you@example.com"
                        />
                    </div>
                    <div style={styles.field}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password" name="password" value={form.password}
                            onChange={handleChange} required
                            style={styles.input}
                            placeholder=""
                        />
                    </div>

                    <div style={{textAlign: "right"}}>
                    <Link to="/forgot-password" style={styles.link}>Forgot Password</Link>
                    </div>

                    <button type="submit" disabled={loading} style={styles.btn}>
                        {loading ? "Signing in…" : "Sign in"}
                    </button>
                </form>

                <div style={styles.footer}>
                    Don't have an account?{" "}
                    <Link to="/register" style={styles.link}>Create account</Link>
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
        fontFamily: "'Google Sans', sans-serif"
    },
    card: {
        background: "#fff",
        borderRadius: 16,
        padding: "48px 40px",
        width: "100%",
        maxWidth: 420,
        boxShadow: "0 2px 10px rgba(0,0,0,.08), 0 0 0 1px rgba(0,0,0,.05)"
    },
    logoRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 28 },
    logoText: { fontSize: 22, fontWeight: 600, color: "#202124", letterSpacing: "-0.3px" },
    title: { fontSize: 24, fontWeight: 600, color: "#202124", marginBottom: 8 },
    subtitle: { fontSize: 15, color: "#5f6368", marginBottom: 28 },
    error: {
        background: "#fce8e6", color: "#d93025", fontSize: 14,
        padding: "12px 16px", borderRadius: 8, marginBottom: 20, lineHeight: 1.5
    },
    form: { display: "flex", flexDirection: "column", gap: 20 },
    field: { display: "flex", flexDirection: "column", gap: 6 },
    label: { fontSize: 13, fontWeight: 500, color: "#3c4043" },
    input: {
        border: "1px solid #dadce0", borderRadius: 8, padding: "12px 16px",
        fontSize: 15, color: "#202124", outline: "none",
        transition: "border-color .2s",
        fontFamily: "inherit"
    },
    btn: {
        background: "#1a73e8", color: "#fff", border: "none",
        borderRadius: 8, padding: "13px 24px", fontSize: 15, fontWeight: 500,
        cursor: "pointer", marginTop: 8, fontFamily: "inherit",
        transition: "background .2s"
    },
    footer: { marginTop: 28, textAlign: "center", fontSize: 14, color: "#5f6368" },
    link: { color: "#1a73e8", textDecoration: "none", fontWeight: 500 }
};
