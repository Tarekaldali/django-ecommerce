from django.db.models import Sum
from django.db.models.functions import TruncDate


def admin_dashboard_stats(request):
    if not request.path.startswith("/admin") or not request.user.is_authenticated or not request.user.is_staff:
        return {}

    try:
        from .models import Order, OrderItem, Product

        sales_total = Order.objects.filter(payment_status=Order.PaymentStatus.PAID).aggregate(total=Sum("total"))["total"] or 0
        order_count = Order.objects.count()
        low_stock = Product.objects.filter(is_active=True, stock_quantity__lte=5).order_by("stock_quantity")[:5]
        revenue_series = (
            Order.objects.filter(payment_status=Order.PaymentStatus.PAID)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(total=Sum("total"))
            .order_by("-day")[:7]
        )
        top_products = (
            OrderItem.objects.values("product_name")
            .annotate(quantity_sold=Sum("quantity"), revenue=Sum("total_price"))
            .order_by("-quantity_sold")[:5]
        )
    except Exception:
        return {}

    return {
        "admin_dashboard": {
            "sales_total": sales_total,
            "order_count": order_count,
            "low_stock_products": low_stock,
            "revenue_series": list(reversed(list(revenue_series))),
            "top_products": top_products,
        }
    }

