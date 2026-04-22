export default function PromoStrip({ promos = [] }) {
  return (
    <div className="promo-strip">
      {promos.map((promo) => (
        <article key={promo.title}>
          <strong>{promo.title}</strong>
          <p>{promo.description}</p>
        </article>
      ))}
    </div>
  );
}

