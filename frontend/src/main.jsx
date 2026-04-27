import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { PopupProvider } from "./contexts/PopupContext";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <PopupProvider>
              <App />
            </PopupProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
  </React.StrictMode>
);

