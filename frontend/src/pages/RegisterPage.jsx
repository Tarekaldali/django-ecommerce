import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    email: "",
    username: "",
    first_name: "",
    last_name: "",
    phone: "",
    password: "",
  });
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
      await register(form);
      navigate("/account");
    } catch (registerError) {
      setError(registerError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card auth-card--wide" onSubmit={handleSubmit}>
        <span className="eyebrow">Join Flipmart</span>
        <h1>Create Account</h1>
        <p>Register to manage orders, shipping addresses, and checkout securely.</p>
        {error ? <div className="error-banner">{error}</div> : null}
        <div className="form-grid">
          <label>
            First name
            <input name="first_name" onChange={handleChange} value={form.first_name} />
          </label>
          <label>
            Last name
            <input name="last_name" onChange={handleChange} value={form.last_name} />
          </label>
          <label>
            Username
            <input name="username" onChange={handleChange} value={form.username} />
          </label>
          <label>
            Phone
            <input name="phone" onChange={handleChange} value={form.phone} />
          </label>
          <label className="form-grid__full">
            Email
            <input name="email" onChange={handleChange} type="email" value={form.email} />
          </label>
          <label className="form-grid__full">
            Password
            <input name="password" onChange={handleChange} type="password" value={form.password} />
          </label>
        </div>
        <button className="button button--primary" disabled={loading} type="submit">
          {loading ? "Creating..." : "Create Account"}
        </button>
        <p>
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

