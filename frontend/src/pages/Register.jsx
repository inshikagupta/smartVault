import { useState } from "react";
import { registerUser } from "../services/auth.service";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const nameValue = form.name.trim();
    const emailValue = form.email.trim();
    const nameRegex = /^[a-zA-Z\s]{3,50}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!nameValue || !emailValue || !form.password) {
      setError("All fields are required.");
      return;
    }
    if (!nameRegex.test(nameValue)) {
      setError("Name is not valid. Use letters and spaces only, 3-50 characters.");
      return;
    }
    if (!emailRegex.test(emailValue)) {
      setError("Email is not valid.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      const data = await registerUser(form);
      if (data.success) {
        navigate("/");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Registration failed.");
    }
  };

  return (

    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#f5f5f5"
    }}>

      <div style={{
        width: "400px",
        background: "white",
        padding: "40px",
        borderRadius: "12px"
      }}>

        <h1 style={{
          fontSize: "40px",
          marginBottom: "10px"
        }}>
          Create account
        </h1>

        <p style={{
          marginBottom: "30px",
          color: "gray"
        }}>
          Already have one?
          <Link
            to="/"
            style={{
              color: "blue",
              marginLeft: "5px",
              textDecoration: "none"
            }}
          >
            Sign in
          </Link>
        </p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ marginBottom: "20px", color: "#d93025", fontWeight: 500 }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label>Full name</label>

            <input
              type="text"
              name="name"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "14px",
                marginTop: "8px",
                borderRadius: "8px",
                border: "1px solid #ccc"
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label>Email</label>

            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "14px",
                marginTop: "8px",
                borderRadius: "8px",
                border: "1px solid #ccc"
              }}
            />
          </div>

          <div style={{ marginBottom: "30px" }}>
            <label>Password</label>

            <div style={{ position: "relative" }}>

              <input
                type={showPass ? "text" : "password"}
                name="password"
                placeholder="Create a strong password"
                value={form.password}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "14px",
                  marginTop: "8px",
                  borderRadius: "8px",
                  border: "1px solid #ccc"
                }}
              />

              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "20px",
                  border: "none",
                  background: "none",
                  cursor: "pointer"
                }}
              >
                {showPass ? "Hide" : "Show"}
              </button>

            </div>
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "30px",
              border: "none",
              background: "#1155cc",
              color: "white",
              fontSize: "20px",
              cursor: "pointer"
            }}
          >
            Create account
          </button>

        </form>

      </div>

    </div>
  );
}