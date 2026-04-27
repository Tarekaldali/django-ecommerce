from django.contrib.auth import get_user_model
from django.db.models import Count
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .filters import ProductFilter
from .models import Address, CartItem, Category, ContactMessage, Order, Product
from .serializers import (
    ActiveCartSerializer,
    AddCartItemSerializer,
    AddressSerializer,
    CartSerializer,
    CategorySerializer,
    CheckoutSerializer,
    ContactMessageSerializer,
    CustomTokenObtainPairSerializer,
    HomeSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    RegisterSerializer,
    UpdateCartItemSerializer,
    UserSerializer,
)
from .services import get_or_create_active_cart


User = get_user_model()


class RegisterAPIView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginAPIView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


class HomeAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        categories = Category.objects.annotate(product_count=Count("products")).filter(is_featured=True)[:8]
        featured_products = Product.objects.filter(is_active=True, is_featured=True).select_related("category")[:8]
        new_arrivals = Product.objects.filter(is_active=True).select_related("category")[:8]

        payload = {
            "hero": {
                "eyebrow": "Spring Collection",
                "title": "Women Fashion",
                "subtitle": "Discover statement pieces, quick shipping, and curated seasonal offers inspired by the Flipmart storefront.",
                "cta_primary": {"label": "Shop Now", "href": "/products?featured=true"},
                "cta_secondary": {"label": "New Arrivals", "href": "/products?ordering=-created_at"},
            },
            "promos": [
                {"title": "Money Back", "description": "30 days money back guarantee"},
                {"title": "Free Shipping", "description": "Shipping on orders over $150"},
                {"title": "Special Sale", "description": "Save up to 40% on curated picks"},
            ],
            "categories": categories,
            "featured_products": featured_products,
            "new_arrivals": new_arrivals,
        }
        serializer = HomeSerializer(payload, context={"request": request})
        return Response(serializer.data)


class CategoryListAPIView(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        return Category.objects.annotate(product_count=Count("products")).order_by("name")


class ProductListAPIView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_class = ProductFilter
    search_fields = ["name", "description", "short_description", "brand", "category__name", "tags"]
    ordering_fields = ["price", "created_at", "rating"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Product.objects.filter(is_active=True).select_related("category")


class ProductDetailAPIView(generics.RetrieveAPIView):
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Product.objects.filter(is_active=True).select_related("category")
    lookup_field = "slug"


class ProfileAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class AddressListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return self.request.user.addresses.all()


class AddressDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.addresses.all()


class CartAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart = get_or_create_active_cart(request.user)
        return Response(CartSerializer(cart, context={"request": request}).data)


class CartItemCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AddCartItemSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        cart = serializer.save()
        return Response(CartSerializer(cart, context={"request": request}).data, status=status.HTTP_201_CREATED)


class CartItemDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, request, pk):
        cart = get_or_create_active_cart(request.user)
        return generics.get_object_or_404(CartItem.objects.select_related("product"), pk=pk, cart=cart)

    def patch(self, request, pk):
        item = self.get_object(request, pk)
        serializer = UpdateCartItemSerializer(data=request.data, context={"item": item})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(CartSerializer(item.cart, context={"request": request}).data)

    def delete(self, request, pk):
        item = self.get_object(request, pk)
        cart = item.cart
        item.delete()
        return Response(CartSerializer(cart, context={"request": request}).data, status=status.HTTP_200_OK)


class CheckoutAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderDetailSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderListAPIView(generics.ListAPIView):
    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return self.request.user.orders.prefetch_related("items")


class OrderDetailAPIView(generics.RetrieveAPIView):
    serializer_class = OrderDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "order_number"

    def get_queryset(self):
        return self.request.user.orders.prefetch_related("items")


class ContactMessageCreateAPIView(generics.CreateAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]


class SessionAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = ActiveCartSerializer(request.user, context={"request": request})
        return Response({"user": UserSerializer(request.user).data, **serializer.data})


class RefreshAPIView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]
