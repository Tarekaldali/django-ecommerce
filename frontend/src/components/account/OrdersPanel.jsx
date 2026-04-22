import { formatCurrency, formatDate } from "../../utils/format";

export default function OrdersPanel({ orders }) {
  return (
    <section className="account-panel">
      <div className="account-panel__header">
        <h2>Order History</h2>
        <p>Track your recent orders and current fulfillment status.</p>
      </div>

      <div className="orders-list">
        {orders.map((order) => (
          <article className="order-card" key={order.id}>
            <div className="order-card__header">
              <div>
                <strong>{order.order_number}</strong>
                <p>Placed {formatDate(order.created_at)}</p>
              </div>
              <span className={`status-pill status-pill--${order.status}`}>{order.status}</span>
            </div>
            <div className="order-card__meta">
              <span>{order.item_count} items</span>
              <span>{order.payment_status}</span>
              <strong>{formatCurrency(order.total)}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

