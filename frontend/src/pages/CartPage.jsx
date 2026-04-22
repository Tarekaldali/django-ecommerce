import { Link } from "react-router-dom";

import EmptyState from "../components/common/EmptyState";
import CartSummary from "../components/cart/CartSummary";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { formatCurrency } from "../utils/format";

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const { cart, loading, removeFromCart, updateQuantity, workingId } = useCart();

  if (!cart.items.length) {
    return (
      <div className="container page-section">
        <EmptyState
          action={
            <Link className="button button--primary" to="/products">
              Continue Shopping
            </Link>
          }
          description="Browse the catalog and add products to build your order."
          title="Your cart is empty"
        />
      </div>
    );
  }

  return (
    <div className="container page-section cart-layout">
      <section className="cart-items-panel">
        <div className="section-heading">
          <div>
            <span className="section-heading__eyebrow">Shopping Cart</span>
            <h1>Review Your Items</h1>
            {!isAuthenticated ? <p>Sign in before checkout to sync this cart to your account.</p> : null}
          </div>
        </div>

        <div className="cart-list">
          {cart.items.map((item) => (
            <article className="cart-item" key={item.id}>
              <img alt={item.product.name} src={item.product.image} />
              <div className="cart-item__content">
                <Link to={`/products/${item.product.slug}`}>{item.product.name}</Link>
                <p>{formatCurrency(item.unit_price)} each</p>
              </div>
              <label className="cart-item__quantity">
                Qty
                <input
                  disabled={workingId === item.id}
                  min="1"
                  onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                  type="number"
                  value={item.quantity}
                />
              </label>
              <strong>{formatCurrency(item.total_price)}</strong>
              <button className="link-button danger-link" onClick={() => removeFromCart(item.id)} type="button">
                {workingId === item.id ? "Working..." : "Remove"}
              </button>
            </article>
          ))}
        </div>
      </section>

      <CartSummary checkoutDisabled={!isAuthenticated || loading} subtotal={Number(cart.subtotal)} totalItems={cart.total_items} />
    </div>
  );
}

