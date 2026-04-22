export default function ProfilePanel({ form, onChange, onSubmit, saving }) {
  return (
    <section className="account-panel">
      <div className="account-panel__header">
        <h2>Profile</h2>
        <p>Update your personal details and keep your account information current.</p>
      </div>
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          First name
          <input name="first_name" onChange={onChange} value={form.first_name || ""} />
        </label>
        <label>
          Last name
          <input name="last_name" onChange={onChange} value={form.last_name || ""} />
        </label>
        <label>
          Username
          <input name="username" onChange={onChange} value={form.username || ""} />
        </label>
        <label>
          Phone
          <input name="phone" onChange={onChange} value={form.phone || ""} />
        </label>
        <label className="form-grid__full">
          Email
          <input disabled name="email" value={form.email || ""} />
        </label>
        <div className="form-grid__full">
          <button className="button button--primary" disabled={saving} type="submit">
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </section>
  );
}

