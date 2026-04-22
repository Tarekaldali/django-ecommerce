import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";

const primaryLinks = [
  { label: "Home", to: "/" },
  { label: "Clothing", to: "/products?category=clothing" },
  { label: "Electronics", to: "/products?category=electronics" },
  { label: "Health & Beauty", to: "/products?category=health-beauty" },
  { label: "Watches", to: "/products?category=watches" },
  { label: "Shoes", to: "/products?category=shoes" },
  { label: "Kids & Babies", to: "/products?category=kids-babies" },
  { label: "Today's Offer", to: "/products?featured=true" },
];

export default function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { cart } = useCart();
  const [search, setSearch] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");

  function handleSearch(event) {
    event.preventDefault();
    const query = search.trim();
    const params = new URLSearchParams();
    if (query) {
      params.set("search", query);
    }
    if (searchCategory !== "all") {
      params.set("category", searchCategory);
    }
    navigate(params.toString() ? `/products?${params.toString()}` : "/products");
    setSearch("");
  }

  return (
    <header className="site-header">
      <div className="topbar">
        <div className="container topbar__content">
          <p>USD</p>
          <nav className="topbar__links">
            <Link to="/account">My Account</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/cart">My Cart</Link>
            {isAuthenticated ? (
              <button className="link-button" onClick={logout} type="button">
                Logout
              </button>
            ) : (
              <Link to="/login">Login</Link>
            )}
          </nav>
        </div>
      </div>

      <div className="header-main">
        <div className="container header-main__content">
          <Link className="logo" to="/">
            Flipmart
          </Link>
          <form className="header-search" onSubmit={handleSearch}>
            <select onChange={(event) => setSearchCategory(event.target.value)} value={searchCategory}>
              <option value="all">Categories</option>
              <option value="clothing">Clothing</option>
              <option value="electronics">Electronics</option>
              <option value="shoes">Shoes</option>
              <option value="watches">Watches</option>
            </select>
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search here..."
              value={search}
            />
            <button type="submit">Search</button>
          </form>
          <div className="header-actions">
            <div className="header-account">
              <span className="eyebrow">Hello</span>
              <strong>{isAuthenticated ? user?.first_name || user?.email : "Guest"}</strong>
            </div>
            <Link className="cart-pill" to="/cart">
              <span>Cart</span>
              <strong>{cart.total_items || 0}</strong>
            </Link>
          </div>
        </div>
      </div>

      <nav className="primary-nav">
        <div className="container primary-nav__content">
          {primaryLinks.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
