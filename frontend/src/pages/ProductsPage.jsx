import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { apiRequest } from "../api/client";
import EmptyState from "../components/common/EmptyState";
import LoadingState from "../components/common/LoadingState";
import Pagination from "../components/common/Pagination";
import ProductCard from "../components/common/ProductCard";

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [productData, setProductData] = useState(null);
  const [error, setError] = useState("");
  const currentPage = Number(searchParams.get("page") || 1);

  useEffect(() => {
    async function loadPage() {
      try {
        const [categoriesResponse, productsResponse] = await Promise.all([
          apiRequest("/categories/"),
          apiRequest(`/products/?${searchParams.toString()}`),
        ]);
        setCategories(categoriesResponse.results || categoriesResponse);
        setProductData(productsResponse);
      } catch (loadError) {
        setError(loadError.message);
      }
    }

    loadPage();
  }, [searchParams]);

  function updateParam(name, value) {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(name, value);
    } else {
      next.delete(name);
    }
    next.delete("page");
    setSearchParams(next);
  }

  function handlePageChange(pageNumber) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(pageNumber));
    setSearchParams(next);
  }

  if (error) {
    return <div className="container page-section error-banner">{error}</div>;
  }

  if (!productData) {
    return (
      <div className="container page-section">
        <LoadingState label="Loading products..." />
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(productData.count / 12));

  return (
    <div className="container page-section catalog-layout">
      <aside className="catalog-sidebar">
        <div className="panel-title">Filter Products</div>
        <label>
          Search
          <input
            defaultValue={searchParams.get("search") || ""}
            onBlur={(event) => updateParam("search", event.target.value)}
            placeholder="Name, brand, or keyword"
          />
        </label>
        <label>
          Category
          <select onChange={(event) => updateParam("category", event.target.value)} value={searchParams.get("category") || ""}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Minimum price
          <input
            defaultValue={searchParams.get("min_price") || ""}
            onBlur={(event) => updateParam("min_price", event.target.value)}
            type="number"
          />
        </label>
        <label>
          Maximum price
          <input
            defaultValue={searchParams.get("max_price") || ""}
            onBlur={(event) => updateParam("max_price", event.target.value)}
            type="number"
          />
        </label>
        <label className="checkbox-row">
          <input
            checked={searchParams.get("available") === "true"}
            onChange={(event) => updateParam("available", event.target.checked ? "true" : "")}
            type="checkbox"
          />
          In stock only
        </label>
      </aside>

      <section className="catalog-main">
        <div className="catalog-toolbar">
          <div>
            <span className="eyebrow">Products</span>
            <h1>All Products</h1>
            <p>{productData.count} results found.</p>
          </div>
          <label className="catalog-toolbar__sort">
            Sort by
            <select
              onChange={(event) => updateParam("ordering", event.target.value)}
              value={searchParams.get("ordering") || "-created_at"}
            >
              <option value="-created_at">Newest</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="-rating">Top Rated</option>
            </select>
          </label>
        </div>

        {productData.results.length ? (
          <>
            <div className="product-grid">
              {productData.results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Pagination currentPage={currentPage} onChange={handlePageChange} totalPages={totalPages} />
          </>
        ) : (
          <EmptyState
            action={null}
            description="Try changing the filters or search query to find matching products."
            title="No products matched your filters"
          />
        )}
      </section>
    </div>
  );
}

