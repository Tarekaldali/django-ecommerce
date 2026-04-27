import { Link } from "react-router-dom";

import { useCart } from "../../hooks/useCart";
import { usePopup } from "../../contexts/PopupContext";
import { formatCurrency } from "../../utils/format";

const placeholderImage = "https://placehold.co/600x700/f1f5f9/122033?text=Product";

export default function ProductCard({ product }) {
  const { addToCart, workingId } = useCart();
  const { showPopup } = usePopup();

  async function handleAddToCart() {
    try {
      await addToCart(product, 1);
    } catch (error) {
      showPopup(error.message);
    }
  }

  return (
    <article className="product-card">
      <Link className="product-card__image" to={`/products/${product.slug}`}>
        <img alt={product.name} src={product.image || placeholderImage} />
        {product.compare_at_price ? <span className="product-badge">Sale</span> : null}
      </Link>
      <div className="product-card__body">
        <span className="product-card__category">{product.category?.name}</span>
        <Link className="product-card__title" to={`/products/${product.slug}`}>
          {product.name}
        </Link>
        <p className="product-card__description">{product.short_description}</p>
        <div className="product-card__price-row">
          <strong>{formatCurrency(product.price)}</strong>
          {product.compare_at_price ? <span>{formatCurrency(product.compare_at_price)}</span> : null}
        </div>
        <button
          className="button button--primary button--small"
          disabled={!product.is_in_stock || workingId === product.id}
          onClick={handleAddToCart}
          type="button"
        >
          {product.is_in_stock ? (workingId === product.id ? "Adding..." : "Add to Cart") : "Out of Stock"}
        </button>
      </div>
    </article>
  );
}
