import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form);
      navigate(location.state?.from || "/account");
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="eyebrow">Welcome Back</span>
        <h1>Login</h1>
        <p>Access your account, saved addresses, order history, and active cart.</p>
        {error ? <div className="error-banner">{error}</div> : null}
        <label>
          Email
          <input name="email" onChange={handleChange} type="email" value={form.email} />
        </label>
        <label>
          Password
          <input name="password" onChange={handleChange} type="password" value={form.password} />
        </label>
        <button className="button button--primary" disabled={loading} type="submit">
          {loading ? "Logging In..." : "Login"}
        </button>
        <p>
          Need an account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </div>
  );
}

