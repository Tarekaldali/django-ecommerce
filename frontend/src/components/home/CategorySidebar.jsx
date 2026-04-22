import { Link } from "react-router-dom";

export default function CategorySidebar({ categories = [] }) {
  return (
    <aside className="category-sidebar">
      <div className="panel-title">Categories</div>
      <div className="category-sidebar__list">
        {categories.map((category) => (
          <Link key={category.id} to={`/products?category=${category.slug}`}>
            <span>{category.name}</span>
            <small>{category.product_count} items</small>
          </Link>
        ))}
      </div>
    </aside>
  );
}

