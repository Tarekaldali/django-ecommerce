import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../api/client";
import LoadingState from "../components/common/LoadingState";
import CategorySidebar from "../components/home/CategorySidebar";
import HeroBanner from "../components/home/HeroBanner";
import ProductSection from "../components/home/ProductSection";
import PromoStrip from "../components/home/PromoStrip";
import { formatCurrency } from "../utils/format";

export default function HomePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHome() {
      try {
        const response = await apiRequest("/home/");
        setData(response);
      } catch (loadError) {
        setError(loadError.message);
      }
    }

    loadHome();
  }, []);

  if (error) {
    return <div className="container page-section error-banner">{error}</div>;
  }

  if (!data) {
    return (
      <div className="container page-section">
        <LoadingState label="Loading Flipmart storefront..." />
      </div>
    );
  }

  const hotDeal = data.featured_products[0];

  return (
    <div className="home-page">
      <div className="container page-section hero-layout">
        <CategorySidebar categories={data.categories} />
        <div className="hero-layout__main">
          <HeroBanner hero={data.hero} />
          <PromoStrip promos={data.promos} />
        </div>
      </div>

      <div className="container home-content">
        <aside className="deal-panel">
          <span className="panel-title">Hot Deals</span>
          {hotDeal ? (
            <>
              <img alt={hotDeal.name} src={hotDeal.image} />
              <h3>{hotDeal.name}</h3>
              <p>{hotDeal.short_description}</p>
              <div className="deal-panel__timer">
                <span>1d</span>
                <span>20h</span>
                <span>36m</span>
              </div>
              <strong>{formatCurrency(hotDeal.price)}</strong>
              <Link className="button button--primary button--block" to={`/products/${hotDeal.slug}`}>
                Shop Deal
              </Link>
            </>
          ) : null}
        </aside>

        <div className="home-content__main">
          <ProductSection
            actionHref="/products?featured=true"
            products={data.featured_products}
            subtitle="Feature-rich picks across fashion, tech, beauty, and home."
            title="New Products"
          />

          <section className="split-banner-row">
            <article className="split-banner split-banner--yellow">
              <span>2026 Fashion Sale</span>
              <h3>Step into fresh silhouettes and bright seasonal color.</h3>
              <Link to="/products?category=clothing">Buy Now</Link>
            </article>
            <article className="split-banner split-banner--pink">
              <span>Save up to 50%</span>
              <h3>Accessories and statement items that bring the storefront to life.</h3>
              <Link to="/products?category=jewellery">Discover More</Link>
            </article>
          </section>

          <ProductSection
            actionHref="/products?ordering=-created_at"
            products={data.new_arrivals}
            subtitle="Fresh arrivals ready to move from cart to checkout."
            title="Latest Arrivals"
          />
        </div>
      </div>
    </div>
  );
}

