import { Link } from "react-router-dom";

const heroImage =
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80";

export default function HeroBanner({ hero }) {
  return (
    <section className="hero-banner">
      <div className="hero-banner__content">
        <span className="hero-banner__eyebrow">{hero.eyebrow}</span>
        <h1>{hero.title}</h1>
        <p>{hero.subtitle}</p>
        <div className="hero-banner__actions">
          <Link className="button button--primary" to={hero.cta_primary.href}>
            {hero.cta_primary.label}
          </Link>
          <Link className="button button--ghost" to={hero.cta_secondary.href}>
            {hero.cta_secondary.label}
          </Link>
        </div>
      </div>
      <div className="hero-banner__art">
        <img alt="Fashion campaign" src={heroImage} />
      </div>
    </section>
  );
}

