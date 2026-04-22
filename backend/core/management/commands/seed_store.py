from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from core.models import Address, Cart, CartItem, Category, Order, OrderItem, Product, User
from core.services import get_or_create_active_cart


CATEGORY_DATA = [
    {"name": "Clothing", "description": "Modern clothing staples and signature outfits.", "icon": "shirt"},
    {"name": "Electronics", "description": "Smart devices and daily tech upgrades.", "icon": "monitor-smartphone"},
    {"name": "Shoes", "description": "Sneakers, heels, and all-day comfort styles.", "icon": "footprints"},
    {"name": "Watches", "description": "Classic and trend-led timepieces.", "icon": "watch"},
    {"name": "Jewellery", "description": "Delicate and statement accessories.", "icon": "gem"},
    {"name": "Health & Beauty", "description": "Skincare, wellness, and beauty favorites.", "icon": "sparkles"},
    {"name": "Kids & Babies", "description": "Playful picks for children and infants.", "icon": "baby"},
    {"name": "Home & Garden", "description": "Decor, storage, and comfort for the home.", "icon": "house"},
]


PRODUCT_DATA = [
    {
        "category": "Clothing",
        "name": "Floral Print Buttoned Dress",
        "sku": "CL-1001",
        "brand": "Maison Lune",
        "short_description": "Printed midi dress with a flattering tailored waist.",
        "description": "A lightweight statement dress made for warm-weather weekends and polished city evenings.",
        "price": Decimal("89.99"),
        "compare_at_price": Decimal("119.99"),
        "stock_quantity": 18,
        "is_featured": True,
        "rating": Decimal("4.80"),
        "review_count": 58,
        "image_url": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
        "tags": "dress, floral, women, featured",
    },
    {
        "category": "Watches",
        "name": "Chronograph Steel Watch",
        "sku": "WA-2100",
        "brand": "Orbit",
        "short_description": "Polished steel chronograph with day-to-day versatility.",
        "description": "A clean chronograph face, sturdy stainless strap, and water-resistant design for daily wear.",
        "price": Decimal("149.00"),
        "compare_at_price": Decimal("199.00"),
        "stock_quantity": 13,
        "is_featured": True,
        "rating": Decimal("4.70"),
        "review_count": 77,
        "image_url": "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=80",
        "tags": "watch, men, luxury, featured",
    },
    {
        "category": "Jewellery",
        "name": "Golden Rim Sunglasses",
        "sku": "JW-3302",
        "brand": "Linea",
        "short_description": "Oversized frames with warm gold hardware.",
        "description": "A refined eyewear statement with lightweight comfort and polished detailing.",
        "price": Decimal("59.50"),
        "compare_at_price": Decimal("79.00"),
        "stock_quantity": 26,
        "is_featured": True,
        "rating": Decimal("4.60"),
        "review_count": 43,
        "image_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=80",
        "tags": "eyewear, accessories, women",
    },
    {
        "category": "Home & Garden",
        "name": "Everyday Leather Tote",
        "sku": "HG-4201",
        "brand": "Atelier",
        "short_description": "Structured bag with roomy interior storage.",
        "description": "Carry workday essentials and weekend extras in this sharply shaped faux leather tote.",
        "price": Decimal("129.99"),
        "compare_at_price": Decimal("169.99"),
        "stock_quantity": 9,
        "is_featured": True,
        "rating": Decimal("4.90"),
        "review_count": 91,
        "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
        "tags": "bag, tote, women, featured",
    },
    {
        "category": "Shoes",
        "name": "Suede City Loafers",
        "sku": "SH-5008",
        "brand": "Northline",
        "short_description": "Soft suede loafers with all-day cushioning.",
        "description": "A polished slip-on designed for effortless styling with breathable construction and soft lining.",
        "price": Decimal("99.99"),
        "compare_at_price": Decimal("139.99"),
        "stock_quantity": 22,
        "is_featured": False,
        "rating": Decimal("4.50"),
        "review_count": 35,
        "image_url": "https://images.unsplash.com/photo-1542291026-1534b7084f84?auto=format&fit=crop&w=900&q=80",
        "tags": "shoes, loafers, sale",
    },
    {
        "category": "Electronics",
        "name": "Wireless Noise-Cancel Headphones",
        "sku": "EL-9021",
        "brand": "Nova Audio",
        "short_description": "Immersive sound with up to 40 hours of playback.",
        "description": "Foldable over-ear headphones with deep bass, USB-C fast charging, and balanced ANC performance.",
        "price": Decimal("179.99"),
        "compare_at_price": Decimal("229.99"),
        "stock_quantity": 16,
        "is_featured": True,
        "rating": Decimal("4.75"),
        "review_count": 88,
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
        "tags": "electronics, audio, headphones, featured",
    },
    {
        "category": "Electronics",
        "name": "Minimal Smart Speaker",
        "sku": "EL-9034",
        "brand": "Halo Home",
        "short_description": "Compact smart speaker with room-filling audio.",
        "description": "Voice-ready smart speaker with warm sound tuning and seamless streaming support.",
        "price": Decimal("89.00"),
        "compare_at_price": Decimal("109.00"),
        "stock_quantity": 27,
        "is_featured": False,
        "rating": Decimal("4.40"),
        "review_count": 24,
        "image_url": "https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=900&q=80",
        "tags": "electronics, smart home",
    },
    {
        "category": "Health & Beauty",
        "name": "Glow Renewal Skincare Set",
        "sku": "HB-1500",
        "brand": "Pure Dew",
        "short_description": "A daily hydration routine for bright, smooth skin.",
        "description": "Includes cleanser, serum, and moisturizer formulated to refresh and nourish throughout the week.",
        "price": Decimal("64.99"),
        "compare_at_price": Decimal("89.99"),
        "stock_quantity": 31,
        "is_featured": False,
        "rating": Decimal("4.65"),
        "review_count": 53,
        "image_url": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80",
        "tags": "beauty, skincare, wellness",
    },
    {
        "category": "Kids & Babies",
        "name": "Playroom Storage Basket Set",
        "sku": "KB-7750",
        "brand": "Nest & Joy",
        "short_description": "Soft-sided organizers for toys, books, and blankets.",
        "description": "Three cotton storage baskets that keep everyday essentials neatly in reach.",
        "price": Decimal("39.99"),
        "compare_at_price": Decimal("55.00"),
        "stock_quantity": 19,
        "is_featured": False,
        "rating": Decimal("4.55"),
        "review_count": 29,
        "image_url": "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80",
        "tags": "kids, storage, home",
    },
    {
        "category": "Clothing",
        "name": "Tailored Linen Blazer",
        "sku": "CL-1048",
        "brand": "Maison Lune",
        "short_description": "Breathable linen blazer with modern structure.",
        "description": "An easy layering piece with clean lapels, refined texture, and lightweight comfort.",
        "price": Decimal("119.99"),
        "compare_at_price": Decimal("149.99"),
        "stock_quantity": 11,
        "is_featured": False,
        "rating": Decimal("4.72"),
        "review_count": 46,
        "image_url": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80",
        "tags": "blazer, women, linen",
    },
    {
        "category": "Shoes",
        "name": "Performance Knit Sneakers",
        "sku": "SH-5120",
        "brand": "Stride",
        "short_description": "Responsive everyday sneakers with breathable knit upper.",
        "description": "Cushioned running-inspired sneakers built for commuting, travel, and all-day comfort.",
        "price": Decimal("109.00"),
        "compare_at_price": Decimal("139.00"),
        "stock_quantity": 15,
        "is_featured": True,
        "rating": Decimal("4.68"),
        "review_count": 64,
        "image_url": "https://images.unsplash.com/photo-1542291026-1534b7084f84?auto=format&fit=crop&w=900&q=80",
        "tags": "shoes, sneakers, featured",
    },
    {
        "category": "Home & Garden",
        "name": "Accent Table Lamp",
        "sku": "HG-4507",
        "brand": "Casa Forma",
        "short_description": "Warm brass lamp with soft linen shade.",
        "description": "A living-room and bedside essential with warm ambient light and timeless detailing.",
        "price": Decimal("72.00"),
        "compare_at_price": Decimal("96.00"),
        "stock_quantity": 8,
        "is_featured": False,
        "rating": Decimal("4.58"),
        "review_count": 18,
        "image_url": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
        "tags": "home, lighting, decor",
    },
]


class Command(BaseCommand):
    help = "Seed demo categories, products, users, addresses, carts, and orders for the e-commerce platform."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Delete existing store data before seeding.")

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            self.stdout.write(self.style.WARNING("Resetting existing demo data..."))
            OrderItem.objects.all().delete()
            Order.objects.all().delete()
            CartItem.objects.all().delete()
            Cart.objects.all().delete()
            Address.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()

        categories = {}
        for item in CATEGORY_DATA:
            category, _ = Category.objects.update_or_create(
                name=item["name"],
                defaults={
                    "description": item["description"],
                    "icon": item["icon"],
                    "is_featured": True,
                },
            )
            categories[item["name"]] = category

        for item in PRODUCT_DATA:
            Product.objects.update_or_create(
                sku=item["sku"],
                defaults={
                    "category": categories[item["category"]],
                    "name": item["name"],
                    "brand": item["brand"],
                    "short_description": item["short_description"],
                    "description": item["description"],
                    "price": item["price"],
                    "compare_at_price": item["compare_at_price"],
                    "stock_quantity": item["stock_quantity"],
                    "is_featured": item["is_featured"],
                    "is_active": True,
                    "rating": item["rating"],
                    "review_count": item["review_count"],
                    "image_url": item["image_url"],
                    "tags": item["tags"],
                },
            )

        admin_user, created = User.objects.get_or_create(
            email="admin@flipmart.local",
            defaults={
                "username": "flipmartadmin",
                "first_name": "Flipmart",
                "last_name": "Admin",
                "role": User.Role.MANAGER,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            admin_user.set_password("Admin123!")
            admin_user.save()

        customer, created = User.objects.get_or_create(
            email="customer@flipmart.local",
            defaults={
                "username": "flipmartcustomer",
                "first_name": "Demo",
                "last_name": "Customer",
                "phone": "+96170000000",
                "role": User.Role.CUSTOMER,
            },
        )
        if created:
            customer.set_password("Demo12345!")
            customer.save()

        address, _ = Address.objects.update_or_create(
            user=customer,
            title="Home",
            defaults={
                "address_type": Address.AddressType.SHIPPING,
                "full_name": "Demo Customer",
                "phone_number": "+96170000000",
                "address_line_1": "12 Fashion Avenue",
                "address_line_2": "Apartment 7",
                "city": "Beirut",
                "state": "Beirut",
                "postal_code": "1107",
                "country": "Lebanon",
                "is_default": True,
            },
        )

        cart = get_or_create_active_cart(customer)
        cart.items.all().delete()
        cart_products = list(Product.objects.order_by("id")[:2])
        for index, product in enumerate(cart_products, start=1):
            CartItem.objects.create(cart=cart, product=product, quantity=index, unit_price=product.price)

        if not customer.orders.exists():
            ordered_products = list(Product.objects.order_by("id")[2:5])
            subtotal = sum(product.price for product in ordered_products)
            order = Order.objects.create(
                user=customer,
                order_number="FM-DEMO-1001",
                status=Order.Status.SHIPPED,
                payment_method=Order.PaymentMethod.MOCK,
                payment_status=Order.PaymentStatus.PAID,
                subtotal=subtotal,
                shipping_fee=Decimal("0.00"),
                total=subtotal,
                shipping_name=address.full_name,
                shipping_phone=address.phone_number,
                shipping_line_1=address.address_line_1,
                shipping_line_2=address.address_line_2,
                shipping_city=address.city,
                shipping_state=address.state,
                shipping_postal_code=address.postal_code,
                shipping_country=address.country,
                notes="Demo seeded order",
            )
            for product in ordered_products:
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    product_sku=product.sku,
                    product_image_url=product.display_image,
                    unit_price=product.price,
                    quantity=1,
                    total_price=product.price,
                )

        self.stdout.write(self.style.SUCCESS("Seed complete."))
        self.stdout.write("Admin login: admin@flipmart.local / Admin123!")
        self.stdout.write("Customer login: customer@flipmart.local / Demo12345!")

