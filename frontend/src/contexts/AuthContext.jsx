import { createContext, useContext, useEffect, useState } from "react";

import { apiRequest } from "../api/client";

const AUTH_STORAGE_KEY = "flipmart-auth";
const AuthContext = createContext(null);

function loadStoredAuth() {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (_error) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadStoredAuth);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    setBooting(false);
  }, []);

  useEffect(() => {
    if (auth) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [auth]);

  const isAuthenticated = Boolean(auth?.access);

  async function login(credentials) {
    const data = await apiRequest("/auth/login/", {
      method: "POST",
      body: credentials,
    });
    const nextAuth = {
      access: data.access,
      refresh: data.refresh,
      user: data.user,
    };
    setAuth(nextAuth);
    return data.user;
  }

  async function register(payload) {
    await apiRequest("/auth/register/", {
      method: "POST",
      body: payload,
    });
    return login({ email: payload.email, password: payload.password });
  }

  async function refreshAccessToken(refreshToken) {
    const data = await apiRequest("/auth/refresh/", {
      method: "POST",
      body: { refresh: refreshToken },
    });
    return data.access;
  }

  async function authorizedRequest(path, options = {}) {
    if (!auth?.access) {
      throw new Error("You need to log in first.");
    }

    try {
      return await apiRequest(path, { ...options, token: auth.access });
    } catch (error) {
      if (error.status !== 401 || !auth?.refresh) {
        throw error;
      }

      const newAccessToken = await refreshAccessToken(auth.refresh);
      const nextAuth = { ...auth, access: newAccessToken };
      setAuth(nextAuth);
      return apiRequest(path, { ...options, token: newAccessToken });
    }
  }

  async function refreshSession() {
    if (!auth?.access) {
      return null;
    }
    const data = await authorizedRequest("/auth/session/");
    setAuth((current) => (current ? { ...current, user: data.user } : current));
    return data;
  }

  function updateStoredUser(user) {
    setAuth((current) => (current ? { ...current, user } : current));
  }

  function logout() {
    setAuth(null);
  }

  return (
    <AuthContext.Provider
      value={{
        auth,
        user: auth?.user || null,
        booting,
        isAuthenticated,
        login,
        register,
        logout,
        refreshSession,
        request: authorizedRequest,
        updateStoredUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}

