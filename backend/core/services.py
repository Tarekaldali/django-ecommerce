from decimal import Decimal
from random import randint

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import Address, Cart, CartItem, Order, OrderItem, Product


def get_or_create_active_cart(user):
    cart, _created = Cart.objects.get_or_create(user=user, status=Cart.Status.ACTIVE)
    return cart


def add_product_to_cart(*, user, product, quantity):
    if quantity < 1:
        raise serializers.ValidationError({"quantity": "Quantity must be at least 1."})
    if product.stock_quantity < quantity:
        raise serializers.ValidationError({"quantity": "Requested quantity exceeds available stock."})

    cart = get_or_create_active_cart(user)
    item, created = CartItem.objects.get_or_create(
        cart=cart,
        product=product,
        defaults={"quantity": quantity, "unit_price": product.price},
    )
    if not created:
        new_quantity = item.quantity + quantity
        if new_quantity > product.stock_quantity:
            raise serializers.ValidationError({"quantity": "Requested quantity exceeds available stock."})
        item.quantity = new_quantity
        item.unit_price = product.price
        item.save(update_fields=["quantity", "unit_price", "updated_at"])
    return cart


def build_order_number():
    while True:
        candidate = f"FM{timezone.now():%Y%m%d%H%M%S}{randint(100, 999)}"
        if not Order.objects.filter(order_number=candidate).exists():
            return candidate


@transaction.atomic
def checkout_cart(*, user, validated_data):
    cart = get_or_create_active_cart(user)
    items = list(cart.items.select_related("product"))
    if not items:
        raise serializers.ValidationError({"cart": "Your cart is empty."})

    address = None
    address_id = validated_data.pop("address_id", None)
    if address_id:
        try:
            address = Address.objects.get(id=address_id, user=user)
        except Address.DoesNotExist as exc:
            raise serializers.ValidationError({"address_id": "Selected address does not exist."}) from exc

    shipping = {
        "shipping_name": validated_data.get("shipping_name") or getattr(address, "full_name", ""),
        "shipping_phone": validated_data.get("shipping_phone") or getattr(address, "phone_number", ""),
        "shipping_line_1": validated_data.get("shipping_line_1") or getattr(address, "address_line_1", ""),
        "shipping_line_2": validated_data.get("shipping_line_2") or getattr(address, "address_line_2", ""),
        "shipping_city": validated_data.get("shipping_city") or getattr(address, "city", ""),
        "shipping_state": validated_data.get("shipping_state") or getattr(address, "state", ""),
        "shipping_postal_code": validated_data.get("shipping_postal_code") or getattr(address, "postal_code", ""),
        "shipping_country": validated_data.get("shipping_country") or getattr(address, "country", ""),
    }

    missing_shipping = [key for key, value in shipping.items() if key not in {"shipping_line_2", "shipping_state"} and not value]
    if missing_shipping:
        raise serializers.ValidationError({"shipping": "Complete shipping information is required."})

    subtotal = Decimal("0.00")
    locked_products = {}

    for item in items:
        product = Product.objects.select_for_update().get(pk=item.product_id)
        if not product.is_active or product.stock_quantity <= 0:
            raise serializers.ValidationError({"stock": f"{product.name} is currently unavailable."})
        if item.quantity > product.stock_quantity:
            raise serializers.ValidationError(
                {"stock": f"Only {product.stock_quantity} units of {product.name} are available."}
            )
        item.unit_price = product.price
        subtotal += product.price * item.quantity
        locked_products[item.product_id] = product

    shipping_fee = Decimal("0.00") if subtotal >= Decimal("150.00") else Decimal("12.00")
    payment_method = validated_data.get("payment_method", Order.PaymentMethod.MOCK)
    payment_status = Order.PaymentStatus.PAID if payment_method in {Order.PaymentMethod.CARD, Order.PaymentMethod.MOCK} else Order.PaymentStatus.PENDING
    order_status = Order.Status.PAID if payment_status == Order.PaymentStatus.PAID else Order.Status.PENDING

    order = Order.objects.create(
        user=user,
        cart=cart,
        order_number=build_order_number(),
        status=order_status,
        payment_method=payment_method,
        payment_status=payment_status,
        subtotal=subtotal,
        shipping_fee=shipping_fee,
        total=subtotal + shipping_fee,
        notes=validated_data.get("notes", ""),
        **shipping,
    )

    for item in items:
        product = locked_products[item.product_id]
        OrderItem.objects.create(
            order=order,
            product=product,
            product_name=product.name,
            product_sku=product.sku,
            product_image_url=product.display_image,
            unit_price=product.price,
            quantity=item.quantity,
            total_price=product.price * item.quantity,
        )
        product.stock_quantity -= item.quantity
        product.save(update_fields=["stock_quantity", "updated_at"])

    cart.status = Cart.Status.CONVERTED
    cart.save(update_fields=["status", "updated_at"])
    get_or_create_active_cart(user)
    return order
