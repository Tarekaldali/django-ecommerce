import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../components/common/EmptyState";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { formatCurrency } from "../utils/format";

const emptyShippingForm = {
  shipping_name: "",
  shipping_phone: "",
  shipping_line_1: "",
  shipping_line_2: "",
  shipping_city: "",
  shipping_state: "",
  shipping_postal_code: "",
  shipping_country: "Lebanon",
  payment_method: "card",
  notes: "",
};

export default function CheckoutPage() {
  const { request } = useAuth();
  const { cart, refreshCart } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [form, setForm] = useState(emptyShippingForm);
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAddresses() {
      try {
        const response = await request("/addresses/");
        setAddresses(response.results || response);
        const defaultAddress = (response.results || response).find((address) => address.is_default);
        if (defaultAddress) {
          setSelectedAddressId(String(defaultAddress.id));
        }
      } catch (loadError) {
        setError(loadError.message);
      }
    }

    loadAddresses();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = selectedAddressId ? { address_id: Number(selectedAddressId), payment_method: form.payment_method, notes: form.notes } : form;
      const order = await request("/orders/checkout/", {
        method: "POST",
        body: payload,
      });
      setPlacedOrder(order);
      await refreshCart();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (placedOrder) {
    return (
      <div className="container page-section">
        <div className="success-card">
          <span className="eyebrow">Order Confirmed</span>
          <h1>{placedOrder.order_number}</h1>
          <p>Your checkout completed successfully. The order is now visible in your account dashboard.</p>
          <div className="success-card__meta">
            <span>Status: {placedOrder.status}</span>
            <strong>{formatCurrency(placedOrder.total)}</strong>
          </div>
          <div className="button-row">
            <Link className="button button--primary" to="/account">
              Go to Account
            </Link>
            <Link className="button button--ghost" to="/products">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!cart.items.length) {
    return (
      <div className="container page-section">
        <EmptyState
          action={
            <Link className="button button--primary" to="/products">
              Browse Products
            </Link>
          }
          description="Add items to your cart first, then come back here to place the order."
          title="Your cart is empty"
        />
      </div>
    );
  }

  return (
    <div className="container page-section checkout-layout">
      <form className="checkout-form" onSubmit={handleSubmit}>
        <div className="section-heading">
          <div>
            <span className="section-heading__eyebrow">Checkout</span>
            <h1>Shipping & Payment</h1>
            <p>Choose a saved address or enter a new destination for this order.</p>
          </div>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}

        {addresses.length ? (
          <label>
            Saved address
            <select onChange={(event) => setSelectedAddressId(event.target.value)} value={selectedAddressId}>
              <option value="">Use a new address</option>
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.title} - {address.address_line_1}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {!selectedAddressId ? (
          <div className="form-grid">
            <label>
              Full name
              <input name="shipping_name" onChange={handleChange} value={form.shipping_name} />
            </label>
            <label>
              Phone
              <input name="shipping_phone" onChange={handleChange} value={form.shipping_phone} />
            </label>
            <label className="form-grid__full">
              Address line 1
              <input name="shipping_line_1" onChange={handleChange} value={form.shipping_line_1} />
            </label>
            <label className="form-grid__full">
              Address line 2
              <input name="shipping_line_2" onChange={handleChange} value={form.shipping_line_2} />
            </label>
            <label>
              City
              <input name="shipping_city" onChange={handleChange} value={form.shipping_city} />
            </label>
            <label>
              State
              <input name="shipping_state" onChange={handleChange} value={form.shipping_state} />
            </label>
            <label>
              Postal code
              <input name="shipping_postal_code" onChange={handleChange} value={form.shipping_postal_code} />
            </label>
            <label>
              Country
              <input name="shipping_country" onChange={handleChange} value={form.shipping_country} />
            </label>
          </div>
        ) : null}

        <label>
          Payment method
          <select name="payment_method" onChange={handleChange} value={form.payment_method}>
            <option value="card">Card</option>
            <option value="cod">Cash on delivery</option>
          </select>
        </label>

        <label>
          Notes
          <textarea name="notes" onChange={handleChange} rows="4" value={form.notes} />
        </label>

        <button className="button button--primary" disabled={submitting} type="submit">
          {submitting ? "Placing Order..." : "Place Order"}
        </button>
      </form>

      <aside className="checkout-summary">
        <h3>Order Summary</h3>
        <div className="checkout-summary__items">
          {cart.items.map((item) => (
            <div className="checkout-summary__item" key={item.id}>
              <span>
                {item.product.name} x {item.quantity}
              </span>
              <strong>{formatCurrency(item.total_price)}</strong>
            </div>
          ))}
        </div>
        <div className="cart-summary__row">
          <span>Subtotal</span>
          <strong>{formatCurrency(cart.subtotal)}</strong>
        </div>
        <div className="cart-summary__row">
          <span>Shipping</span>
          <strong>{Number(cart.subtotal) >= 150 ? "Free" : formatCurrency(12)}</strong>
        </div>
        <div className="cart-summary__row cart-summary__row--total">
          <span>Total</span>
          <strong>{formatCurrency(Number(cart.subtotal) + (Number(cart.subtotal) >= 150 ? 0 : 12))}</strong>
        </div>
      </aside>
    </div>
  );
}

