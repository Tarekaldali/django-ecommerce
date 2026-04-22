from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Address, Cart, CartItem, Category, ContactMessage, Order, OrderItem, Product, User


admin.site.site_header = "Flipmart Commerce Admin"
admin.site.site_title = "Flipmart Admin"
admin.site.index_title = "Store Operations"


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    autocomplete_fields = ["product"]
    readonly_fields = ["unit_price", "created_at", "updated_at"]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = [
        "product",
        "product_name",
        "product_sku",
        "product_image_url",
        "unit_price",
        "quantity",
        "total_price",
    ]


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("email", "username", "first_name", "last_name", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_superuser", "is_active")
    search_fields = ("email", "username", "first_name", "last_name")
    ordering = ("email",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("username", "first_name", "last_name", "phone")}),
        ("Permissions", {"fields": ("role", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "username", "password1", "password2", "role", "is_staff", "is_superuser"),
            },
        ),
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_featured", "product_total")
    list_filter = ("is_featured",)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}

    @admin.display(description="Products")
    def product_total(self, obj):
        return obj.products.count()


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "sku",
        "price",
        "stock_quantity",
        "is_featured",
        "is_active",
        "created_at",
    )
    list_filter = ("category", "is_featured", "is_active", "created_at")
    list_editable = ("price", "stock_quantity", "is_featured", "is_active")
    search_fields = ("name", "sku", "brand", "short_description")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "updated_at")


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "status", "total_items", "subtotal_display", "updated_at")
    list_filter = ("status", "updated_at")
    search_fields = ("user__email", "user__username")
    inlines = [CartItemInline]

    @admin.display(description="Subtotal")
    def subtotal_display(self, obj):
        return f"${obj.subtotal:.2f}"


@admin.action(description="Mark selected orders as paid")
def mark_paid(modeladmin, request, queryset):
    queryset.update(status=Order.Status.PAID, payment_status=Order.PaymentStatus.PAID)


@admin.action(description="Mark selected orders as shipped")
def mark_shipped(modeladmin, request, queryset):
    queryset.update(status=Order.Status.SHIPPED)


@admin.action(description="Mark selected orders as delivered")
def mark_delivered(modeladmin, request, queryset):
    queryset.update(status=Order.Status.DELIVERED)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "user", "status", "payment_status", "payment_method", "total", "created_at")
    list_filter = ("status", "payment_status", "payment_method", "created_at")
    search_fields = ("order_number", "user__email", "shipping_name", "shipping_phone")
    readonly_fields = ("order_number", "subtotal", "shipping_fee", "total", "created_at", "updated_at")
    inlines = [OrderItemInline]
    actions = [mark_paid, mark_shipped, mark_delivered]


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "city", "country", "address_type", "is_default")
    list_filter = ("address_type", "country", "is_default")
    search_fields = ("title", "user__email", "full_name", "city", "country")


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("subject", "name", "email", "is_resolved", "created_at")
    list_filter = ("is_resolved", "created_at")
    search_fields = ("subject", "name", "email", "message")
    readonly_fields = ("created_at", "updated_at")


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("order", "product_name", "quantity", "unit_price", "total_price")
    search_fields = ("order__order_number", "product_name", "product_sku")
    readonly_fields = ("created_at", "updated_at")


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ("cart", "product", "quantity", "unit_price", "total_price_display")
    search_fields = ("cart__user__email", "product__name", "product__sku")

    @admin.display(description="Total")
    def total_price_display(self, obj):
        return f"${obj.total_price:.2f}"
