import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import SiteLayout from "./components/layout/SiteLayout";
import { useAuth } from "./hooks/useAuth";
import AccountPage from "./pages/AccountPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ContactPage from "./pages/ContactPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProductsPage from "./pages/ProductsPage";
import RegisterPage from "./pages/RegisterPage";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { booting, isAuthenticated } = useAuth();

  if (booting) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />} path="/">
        <Route index element={<HomePage />} />
        <Route element={<ProductsPage />} path="products" />
        <Route element={<ProductDetailPage />} path="products/:slug" />
        <Route element={<CartPage />} path="cart" />
        <Route
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
          path="checkout"
        />
        <Route
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
          path="account"
        />
        <Route element={<ContactPage />} path="contact" />
        <Route element={<LoginPage />} path="login" />
        <Route element={<RegisterPage />} path="register" />
        <Route element={<NotFoundPage />} path="*" />
      </Route>
    </Routes>
  );
}
