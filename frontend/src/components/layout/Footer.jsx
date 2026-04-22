import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h3>Flipmart Commerce</h3>
          <p>
            A full-stack e-commerce demo with React, Django REST Framework, JWT auth, checkout, and a customized
            Django admin.
          </p>
        </div>
        <div>
          <h4>Store</h4>
          <Link to="/products">Browse Products</Link>
          <Link to="/cart">View Cart</Link>
          <Link to="/checkout">Checkout</Link>
        </div>
        <div>
          <h4>Account</h4>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <Link to="/account">Dashboard</Link>
        </div>
        <div>
          <h4>Support</h4>
          <Link to="/contact">Contact Us</Link>
          <Link to="/products?featured=true">Today's Offer</Link>
        </div>
      </div>
    </footer>
  );
}

