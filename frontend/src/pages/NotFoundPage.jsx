import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="container page-section">
      <div className="state-card state-card--empty">
        <span className="eyebrow">404</span>
        <h1>Page not found</h1>
        <p>The page you requested does not exist or may have moved.</p>
        <Link className="button button--primary" to="/">
          Return Home
        </Link>
      </div>
    </div>
  );
}

