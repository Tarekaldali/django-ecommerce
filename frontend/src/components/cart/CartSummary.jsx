import { Link } from "react-router-dom";

import { formatCurrency } from "../../utils/format";

export default function CartSummary({ subtotal, totalItems, checkoutDisabled }) {
  const shipping = subtotal >= 150 ? 0 : 12;

  return (
    <aside className="cart-summary">
      <h3>Order Summary</h3>
      <div className="cart-summary__row">
        <span>Items</span>
        <strong>{totalItems}</strong>
      </div>
      <div className="cart-summary__row">
        <span>Subtotal</span>
        <strong>{formatCurrency(subtotal)}</strong>
      </div>
      <div className="cart-summary__row">
        <span>Shipping</span>
        <strong>{shipping === 0 ? "Free" : formatCurrency(shipping)}</strong>
      </div>
      <div className="cart-summary__row cart-summary__row--total">
        <span>Total</span>
        <strong>{formatCurrency(subtotal + shipping)}</strong>
      </div>
      <Link className={`button button--primary button--block ${checkoutDisabled ? "is-disabled" : ""}`} to="/checkout">
        Proceed to Checkout
      </Link>
    </aside>
  );
}

