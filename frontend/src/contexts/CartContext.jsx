import { createContext, useContext, useEffect, useState } from "react";

import { useAuth } from "./AuthContext";

const GUEST_CART_STORAGE_KEY = "flipmart-guest-cart";
const CartContext = createContext(null);

function loadGuestCart() {
  try {
    const stored = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (_error) {
    return [];
  }
}

function buildGuestCart(items) {
  const normalizedItems = items.map((item) => ({
    ...item,
    total_price: Number(item.unit_price) * Number(item.quantity),
  }));
  const subtotal = normalizedItems.reduce((sum, item) => sum + item.total_price, 0);
  const totalItems = normalizedItems.reduce((sum, item) => sum + Number(item.quantity), 0);

  return {
    id: "guest-cart",
    status: "guest",
    total_items: totalItems,
    subtotal,
    items: normalizedItems,
  };
}

export function CartProvider({ children }) {
  const { isAuthenticated, request } = useAuth();
  const [guestItems, setGuestItems] = useState(loadGuestCart);
  const [serverCart, setServerCart] = useState({
    status: "active",
    total_items: 0,
    subtotal: 0,
    items: [],
  });
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState(null);

  useEffect(() => {
    localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(guestItems));
  }, [guestItems]);

  async function refreshCart() {
    if (!isAuthenticated) {
      return buildGuestCart(guestItems);
    }
    setLoading(true);
    try {
      const cart = await request("/cart/");
      setServerCart(cart);
      return cart;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    async function syncGuestCart() {
      if (!isAuthenticated || guestItems.length === 0) {
        return;
      }
      setLoading(true);
      try {
        for (const item of guestItems) {
          await request("/cart/items/", {
            method: "POST",
            body: {
              product_id: item.product.id,
              quantity: item.quantity,
            },
          });
        }
        setGuestItems([]);
        await refreshCart();
      } finally {
        setLoading(false);
      }
    }

    syncGuestCart();
  }, [isAuthenticated]);

  async function addToCart(product, quantity = 1) {
    const safeQuantity = Math.max(1, Number(quantity) || 1);
    setWorkingId(product.id);
    try {
      if (isAuthenticated) {
        const cart = await request("/cart/items/", {
          method: "POST",
          body: {
            product_id: product.id,
            quantity: safeQuantity,
          },
        });
        setServerCart(cart);
        return cart;
      }

      setGuestItems((current) => {
        const existing = current.find((item) => item.product.id === product.id);
        if (existing) {
          return current.map((item) =>
            item.product.id === product.id
              ? {
                  ...item,
                  quantity: Math.min(
                    item.quantity + safeQuantity,
                    product.stock_quantity || item.quantity + safeQuantity
                  ),
                }
              : item
          );
        }

        return [
          ...current,
          {
            id: `guest-${product.id}`,
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              stock_quantity: product.stock_quantity,
              image: product.image,
            },
            quantity: safeQuantity,
            unit_price: product.price,
          },
        ];
      });
      return buildGuestCart(guestItems);
    } finally {
      setWorkingId(null);
    }
  }

  async function updateQuantity(itemId, quantity) {
    const safeQuantity = Math.max(1, Number(quantity) || 1);
    setWorkingId(itemId);
    try {
      if (isAuthenticated) {
        const cart = await request(`/cart/items/${itemId}/`, {
          method: "PATCH",
          body: { quantity: safeQuantity },
        });
        setServerCart(cart);
        return cart;
      }

      setGuestItems((current) =>
        current.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity: Math.min(safeQuantity, item.product.stock_quantity || safeQuantity),
              }
            : item
        )
      );
      return buildGuestCart(guestItems);
    } finally {
      setWorkingId(null);
    }
  }

  async function removeFromCart(itemId) {
    setWorkingId(itemId);
    try {
      if (isAuthenticated) {
        const cart = await request(`/cart/items/${itemId}/`, {
          method: "DELETE",
        });
        setServerCart(cart);
        return cart;
      }

      setGuestItems((current) => current.filter((item) => item.id !== itemId));
      return buildGuestCart(guestItems);
    } finally {
      setWorkingId(null);
    }
  }

  const cart = isAuthenticated ? serverCart : buildGuestCart(guestItems);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        workingId,
        addToCart,
        updateQuantity,
        removeFromCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }
  return context;
}
