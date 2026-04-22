import { useState } from "react";

import { apiRequest } from "../api/client";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus({ error: "", success: "" });
    try {
      await apiRequest("/contact/", {
        method: "POST",
        body: form,
      });
      setStatus({ error: "", success: "Thanks for reaching out. Your message has been received." });
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (submitError) {
      setStatus({ error: submitError.message, success: "" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container page-section contact-page">
      <section className="contact-hero">
        <span className="eyebrow">Contact Us</span>
        <h1>How can we help?</h1>
        <p>Send a message to the team and it will be stored directly in the Django admin dashboard.</p>
      </section>

      <form className="contact-card" onSubmit={handleSubmit}>
        {status.error ? <div className="error-banner">{status.error}</div> : null}
        {status.success ? <div className="success-banner">{status.success}</div> : null}
        <div className="form-grid">
          <label>
            Name
            <input name="name" onChange={handleChange} value={form.name} />
          </label>
          <label>
            Email
            <input name="email" onChange={handleChange} type="email" value={form.email} />
          </label>
          <label>
            Phone
            <input name="phone" onChange={handleChange} value={form.phone} />
          </label>
          <label>
            Subject
            <input name="subject" onChange={handleChange} value={form.subject} />
          </label>
          <label className="form-grid__full">
            Message
            <textarea name="message" onChange={handleChange} rows="6" value={form.message} />
          </label>
        </div>
        <button className="button button--primary" disabled={loading} type="submit">
          {loading ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
}

