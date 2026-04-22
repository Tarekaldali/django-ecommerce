import django_filters

from .models import Product


class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name="category__slug", lookup_expr="iexact")
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    available = django_filters.BooleanFilter(method="filter_available")
    featured = django_filters.BooleanFilter(field_name="is_featured")

    class Meta:
        model = Product
        fields = ["category", "min_price", "max_price", "available", "featured"]

    def filter_available(self, queryset, _name, value):
        if value is True:
            return queryset.filter(stock_quantity__gt=0, is_active=True)
        if value is False:
            return queryset.filter(stock_quantity=0)
        return queryset

