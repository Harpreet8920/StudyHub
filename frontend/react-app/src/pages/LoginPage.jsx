import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, setToken } from "../api";

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest("/login", {
        method: "POST",
        body: JSON.stringify(form)
      });
      setToken(data.token);
      navigate("/dashboard");
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Login</h2>
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

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
        <p>
          New user? <Link to="/signup">Create account</Link>
        </p>
      </form>
    </main>
  );
}

export default LoginPage;
