import { Link } from "react-router-dom";

export default function SectionHeading({ title, subtitle, actionLabel, actionHref = "/products" }) {
  return (
    <div className="section-heading">
      <div>
        <span className="section-heading__eyebrow">Curated Picks</span>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actionLabel ? (
        <Link className="section-heading__action" to={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

