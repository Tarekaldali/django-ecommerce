from decimal import Decimal

from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils.text import slugify


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("The email address is required.")
        email = self.normalize_email(email)
        username = extra_fields.get("username")
        if not username:
            username = email.split("@")[0]
            counter = 1
            base_username = username
            while self.model.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            extra_fields["username"] = username
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.Role.MANAGER)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        CUSTOMER = "customer", "Customer"
        STAFF = "staff", "Staff"
        MANAGER = "manager", "Manager"

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=30, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    objects = UserManager()

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = self.Role.MANAGER
        elif self.is_staff and self.role == self.Role.CUSTOMER:
            self.role = self.Role.STAFF
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email


class Category(TimestampedModel):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Lucide icon name used by the frontend.")
    is_featured = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(TimestampedModel):
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    name = models.CharField(max_length=180)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    sku = models.CharField(max_length=50, unique=True)
    brand = models.CharField(max_length=120, blank=True)
    short_description = models.CharField(max_length=220, blank=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    compare_at_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    stock_quantity = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=Decimal("4.50"))
    review_count = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    image_url = models.URLField(blank=True)
    tags = models.CharField(max_length=255, blank=True, help_text="Comma separated tags.")

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    @property
    def is_in_stock(self):
        return self.stock_quantity > 0 and self.is_active

    @property
    def display_image(self):
        if self.image:
            return self.image.url
        return self.image_url

    def __str__(self):
        return self.name


class Cart(TimestampedModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        CONVERTED = "converted", "Converted"
        ABANDONED = "abandoned", "Abandoned"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="carts")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user"],
                condition=Q(status="active"),
                name="unique_active_cart_per_user",
            )
        ]

    @property
    def subtotal(self):
        return sum(item.total_price for item in self.items.select_related("product"))

    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())

    def __str__(self):
        return f"{self.user.email} ({self.status})"


class CartItem(TimestampedModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="cart_items")
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ["created_at"]
        constraints = [
            models.UniqueConstraint(fields=["cart", "product"], name="unique_product_per_cart"),
        ]

    @property
    def total_price(self):
        return self.unit_price * self.quantity

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"


class Address(TimestampedModel):
    class AddressType(models.TextChoices):
        SHIPPING = "shipping", "Shipping"
        BILLING = "billing", "Billing"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="addresses")
    title = models.CharField(max_length=100)
    address_type = models.CharField(max_length=20, choices=AddressType.choices, default=AddressType.SHIPPING)
    full_name = models.CharField(max_length=120)
    phone_number = models.CharField(max_length=30)
    address_line_1 = models.CharField(max_length=255)
    address_line_2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=120)
    state = models.CharField(max_length=120, blank=True)
    postal_code = models.CharField(max_length=30)
    country = models.CharField(max_length=120, default="Lebanon")
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ["-is_default", "-updated_at"]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.is_default:
            self.user.addresses.exclude(pk=self.pk).update(is_default=False)

    def __str__(self):
        return f"{self.title} - {self.user.email}"


class Order(TimestampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    class PaymentMethod(models.TextChoices):
        COD = "cod", "Cash on delivery"
        CARD = "card", "Credit / Debit card"
        MOCK = "mock", "Mock payment"

    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="orders")
    cart = models.OneToOneField(Cart, on_delete=models.SET_NULL, null=True, blank=True, related_name="order")
    order_number = models.CharField(max_length=32, unique=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.MOCK)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    total = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_name = models.CharField(max_length=120)
    shipping_phone = models.CharField(max_length=30)
    shipping_line_1 = models.CharField(max_length=255)
    shipping_line_2 = models.CharField(max_length=255, blank=True)
    shipping_city = models.CharField(max_length=120)
    shipping_state = models.CharField(max_length=120, blank=True)
    shipping_postal_code = models.CharField(max_length=30)
    shipping_country = models.CharField(max_length=120)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.order_number


class OrderItem(TimestampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name="order_items")
    product_name = models.CharField(max_length=180)
    product_sku = models.CharField(max_length=50)
    product_image_url = models.URLField(blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.product_name} x {self.quantity}"


class ContactMessage(TimestampedModel):
    name = models.CharField(max_length=120)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    subject = models.CharField(max_length=180)
    message = models.TextField()
    is_resolved = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.subject} ({self.email})"

