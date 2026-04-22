from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Address, Cart, CartItem, Category, ContactMessage, Order, OrderItem, Product, User
from .services import add_product_to_cart, checkout_cart, get_or_create_active_cart


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "role",
            "is_staff",
        ]
        read_only_fields = ["id", "role", "is_staff"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "email", "username", "first_name", "last_name", "phone", "password"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.EMAIL_FIELD

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["role"] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "icon", "is_featured", "product_count"]


class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    image = serializers.SerializerMethodField()
    is_in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "sku",
            "brand",
            "short_description",
            "price",
            "compare_at_price",
            "stock_quantity",
            "is_featured",
            "rating",
            "review_count",
            "image",
            "is_in_stock",
            "category",
            "created_at",
        ]

    def get_image(self, obj):
        return obj.display_image


class ProductDetailSerializer(ProductListSerializer):
    description = serializers.CharField()
    tags = serializers.SerializerMethodField()

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + ["description", "tags", "is_active"]

    def get_tags(self, obj):
        return [tag.strip() for tag in obj.tags.split(",") if tag.strip()]


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            "id",
            "title",
            "address_type",
            "full_name",
            "phone_number",
            "address_line_1",
            "address_line_2",
            "city",
            "state",
            "postal_code",
            "country",
            "is_default",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        return Address.objects.create(user=self.context["request"].user, **validated_data)


class CartProductSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    is_in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = ["id", "name", "slug", "sku", "price", "stock_quantity", "is_in_stock", "image"]

    def get_image(self, obj):
        return obj.display_image


class CartItemSerializer(serializers.ModelSerializer):
    product = CartProductSerializer(read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "product", "quantity", "unit_price", "total_price"]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_items = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "status", "total_items", "subtotal", "items", "updated_at"]


class AddCartItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)

    def validate_product_id(self, value):
        try:
            product = Product.objects.get(id=value, is_active=True)
        except Product.DoesNotExist as exc:
            raise serializers.ValidationError("Product not found.") from exc
        self.context["product"] = product
        return value

    def save(self, **kwargs):
        return add_product_to_cart(
            user=self.context["request"].user,
            product=self.context["product"],
            quantity=self.validated_data["quantity"],
        )


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)

    def save(self, **kwargs):
        item = self.context["item"]
        if self.validated_data["quantity"] > item.product.stock_quantity:
            raise serializers.ValidationError({"quantity": "Requested quantity exceeds available stock."})
        item.quantity = self.validated_data["quantity"]
        item.unit_price = item.product.price
        item.save(update_fields=["quantity", "unit_price", "updated_at"])
        return item


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product_name",
            "product_sku",
            "product_image_url",
            "unit_price",
            "quantity",
            "total_price",
        ]


class OrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "status",
            "payment_method",
            "payment_status",
            "subtotal",
            "shipping_fee",
            "total",
            "created_at",
            "item_count",
        ]

    def get_item_count(self, obj):
        return obj.items.count()


class OrderDetailSerializer(OrderListSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta(OrderListSerializer.Meta):
        fields = OrderListSerializer.Meta.fields + [
            "shipping_name",
            "shipping_phone",
            "shipping_line_1",
            "shipping_line_2",
            "shipping_city",
            "shipping_state",
            "shipping_postal_code",
            "shipping_country",
            "notes",
            "items",
        ]


class CheckoutSerializer(serializers.Serializer):
    address_id = serializers.IntegerField(required=False)
    shipping_name = serializers.CharField(required=False, allow_blank=True)
    shipping_phone = serializers.CharField(required=False, allow_blank=True)
    shipping_line_1 = serializers.CharField(required=False, allow_blank=True)
    shipping_line_2 = serializers.CharField(required=False, allow_blank=True)
    shipping_city = serializers.CharField(required=False, allow_blank=True)
    shipping_state = serializers.CharField(required=False, allow_blank=True)
    shipping_postal_code = serializers.CharField(required=False, allow_blank=True)
    shipping_country = serializers.CharField(required=False, allow_blank=True)
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices, default=Order.PaymentMethod.MOCK)
    notes = serializers.CharField(required=False, allow_blank=True)

    def save(self, **kwargs):
        return checkout_cart(user=self.context["request"].user, validated_data=self.validated_data)


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["id", "name", "email", "phone", "subject", "message", "created_at"]
        read_only_fields = ["id", "created_at"]


class HomeSerializer(serializers.Serializer):
    hero = serializers.DictField()
    promos = serializers.ListField()
    categories = CategorySerializer(many=True)
    featured_products = ProductListSerializer(many=True)
    new_arrivals = ProductListSerializer(many=True)


class ActiveCartSerializer(serializers.Serializer):
    cart = serializers.SerializerMethodField()

    def get_cart(self, obj):
        cart = get_or_create_active_cart(obj)
        return CartSerializer(cart).data

