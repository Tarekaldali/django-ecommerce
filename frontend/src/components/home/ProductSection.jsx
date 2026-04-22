import ProductCard from "../common/ProductCard";
import SectionHeading from "../common/SectionHeading";

export default function ProductSection({ title, subtitle, products, actionHref = "/products" }) {
  return (
    <section className="content-panel">
      <SectionHeading actionHref={actionHref} actionLabel="View All" subtitle={subtitle} title={title} />
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

