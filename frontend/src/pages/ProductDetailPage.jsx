import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { apiRequest } from "../api/client";
import LoadingState from "../components/common/LoadingState";
import ProductCard from "../components/common/ProductCard";
import { useCart } from "../hooks/useCart";
import { formatCurrency } from "../utils/format";

const placeholderImage = "https://placehold.co/900x1100/f1f5f9/122033?text=Product";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addToCart, workingId } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProduct() {
      try {
        const productResponse = await apiRequest(`/products/${slug}/`);
        setProduct(productResponse);
        const relatedResponse = await apiRequest(`/products/?category=${productResponse.category.slug}`);
        setRelated(
          relatedResponse.results.filter((item) => item.slug !== productResponse.slug).slice(0, 4)
        );
      } catch (loadError) {
        setError(loadError.message);
      }
    }

    loadProduct();
  }, [slug]);

  async function handleAddToCart() {
    try {
      await addToCart(product, quantity);
      alert("Item added to cart.");
    } catch (cartError) {
      alert(cartError.message);
    }
  }

  if (error) {
    return <div className="container page-section error-banner">{error}</div>;
  }

  if (!product) {
    return (
      <div className="container page-section">
        <LoadingState label="Loading product..." />
      </div>
    );
  }

  return (
    <div className="container page-section product-detail-page">
      <div className="product-detail">
        <div className="product-detail__image">
          <img alt={product.name} src={product.image || placeholderImage} />
        </div>
        <div className="product-detail__content">
          <span className="eyebrow">{product.category.name}</span>
          <h1>{product.name}</h1>
          <p className="product-detail__description">{product.description}</p>
          <div className="product-detail__pricing">
            <strong>{formatCurrency(product.price)}</strong>
            {product.compare_at_price ? <span>{formatCurrency(product.compare_at_price)}</span> : null}
          </div>
          <p className={`stock-indicator ${product.is_in_stock ? "is-in" : "is-out"}`}>
            {product.is_in_stock ? `${product.stock_quantity} items in stock` : "Currently unavailable"}
          </p>
          <div className="product-detail__actions">
            <label>
              Quantity
              <input
                max={product.stock_quantity}
                min="1"
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                type="number"
                value={quantity}
              />
            </label>
            <button
              className="button button--primary"
              disabled={!product.is_in_stock || workingId === product.id}
              onClick={handleAddToCart}
              type="button"
            >
              {workingId === product.id ? "Adding..." : "Add to Cart"}
            </button>
            <Link className="button button--ghost" to="/cart">
              View Cart
            </Link>
          </div>
          <div className="product-meta">
            <span>SKU: {product.sku}</span>
            <span>Brand: {product.brand || "Flipmart Edit"}</span>
            <span>Rating: {product.rating} / 5</span>
          </div>
        </div>
      </div>

      {related.length ? (
        <section className="content-panel">
          <div className="section-heading">
            <div>
              <span className="section-heading__eyebrow">More Like This</span>
              <h2>Related Products</h2>
            </div>
          </div>
          <div className="product-grid">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
