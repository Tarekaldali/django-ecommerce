from django.urls import path

from .views import (
    AddressDetailAPIView,
    AddressListCreateAPIView,
    CartAPIView,
    CartItemCreateAPIView,
    CartItemDetailAPIView,
    CategoryListAPIView,
    CheckoutAPIView,
    ContactMessageCreateAPIView,
    HomeAPIView,
    LoginAPIView,
    OrderDetailAPIView,
    OrderListAPIView,
    ProductDetailAPIView,
    ProductListAPIView,
    ProfileAPIView,
    RefreshAPIView,
    RegisterAPIView,
    SessionAPIView,
)


urlpatterns = [
    path("home/", HomeAPIView.as_view(), name="home"),
    path("categories/", CategoryListAPIView.as_view(), name="category-list"),
    path("products/", ProductListAPIView.as_view(), name="product-list"),
    path("products/<slug:slug>/", ProductDetailAPIView.as_view(), name="product-detail"),
    path("auth/register/", RegisterAPIView.as_view(), name="register"),
    path("auth/login/", LoginAPIView.as_view(), name="login"),
    path("auth/refresh/", RefreshAPIView.as_view(), name="token-refresh"),
    path("auth/session/", SessionAPIView.as_view(), name="session"),
    path("profile/", ProfileAPIView.as_view(), name="profile"),
    path("addresses/", AddressListCreateAPIView.as_view(), name="address-list"),
    path("addresses/<int:pk>/", AddressDetailAPIView.as_view(), name="address-detail"),
    path("cart/", CartAPIView.as_view(), name="cart"),
    path("cart/items/", CartItemCreateAPIView.as_view(), name="cart-item-create"),
    path("cart/items/<int:pk>/", CartItemDetailAPIView.as_view(), name="cart-item-detail"),
    path("orders/checkout/", CheckoutAPIView.as_view(), name="checkout"),
    path("orders/", OrderListAPIView.as_view(), name="order-list"),
    path("orders/<str:order_number>/", OrderDetailAPIView.as_view(), name="order-detail"),
    path("contact/", ContactMessageCreateAPIView.as_view(), name="contact"),
]

