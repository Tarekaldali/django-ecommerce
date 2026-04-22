export default function AddressBook({
  addresses,
  form,
  onChange,
  onCreate,
  onDelete,
  onSetDefault,
  saving,
}) {
  return (
    <section className="account-panel">
      <div className="account-panel__header">
        <h2>Address Book</h2>
        <p>Save shipping addresses for a faster checkout experience.</p>
      </div>

      <div className="address-list">
        {addresses.map((address) => (
          <article className="address-card" key={address.id}>
            <div>
              <strong>{address.title}</strong>
              {address.is_default ? <span className="chip">Default</span> : null}
            </div>
            <p>{address.full_name}</p>
            <p>{address.address_line_1}</p>
            {address.address_line_2 ? <p>{address.address_line_2}</p> : null}
            <p>
              {address.city}, {address.country}
            </p>
            <div className="address-card__actions">
              {!address.is_default ? (
                <button className="button button--ghost button--small" onClick={() => onSetDefault(address)} type="button">
                  Set Default
                </button>
              ) : null}
              <button className="button button--outline button--small" onClick={() => onDelete(address.id)} type="button">
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      <form className="form-grid" onSubmit={onCreate}>
        <label>
          Title
          <input name="title" onChange={onChange} value={form.title} />
        </label>
        <label>
          Full name
          <input name="full_name" onChange={onChange} value={form.full_name} />
        </label>
        <label>
          Phone
          <input name="phone_number" onChange={onChange} value={form.phone_number} />
        </label>
        <label>
          Address line 1
          <input name="address_line_1" onChange={onChange} value={form.address_line_1} />
        </label>
        <label className="form-grid__full">
          Address line 2
          <input name="address_line_2" onChange={onChange} value={form.address_line_2} />
        </label>
        <label>
          City
          <input name="city" onChange={onChange} value={form.city} />
        </label>
        <label>
          State
          <input name="state" onChange={onChange} value={form.state} />
        </label>
        <label>
          Postal code
          <input name="postal_code" onChange={onChange} value={form.postal_code} />
        </label>
        <label>
          Country
          <input name="country" onChange={onChange} value={form.country} />
        </label>
        <label className="checkbox-row">
          <input checked={form.is_default} name="is_default" onChange={onChange} type="checkbox" />
          Set as default address
        </label>
        <div className="form-grid__full">
          <button className="button button--primary" disabled={saving} type="submit">
            {saving ? "Saving..." : "Add Address"}
          </button>
        </div>
      </form>
    </section>
  );
}

