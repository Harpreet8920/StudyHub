import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api";

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.username || !form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/signup", {
        method: "POST",
        body: JSON.stringify(form)
      });
      setSuccess("Signup successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 900);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Signup</h2>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          name="username"
          value={form.username}
          onChange={handleChange}
        />

        <label htmlFor="email">Email</label>
        <input id="email" type="email" name="email" value={form.email} onChange={handleChange} />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
        />

        {error && <p className="error-msg">{error}</p>}
        {success && <p className="success-msg">{success}</p>}

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? "Creating account..." : "Signup"}
        </button>
        <p>
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}

export default SignupPage;
