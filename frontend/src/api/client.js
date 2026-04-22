const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

function extractErrorMessage(payload) {
  if (!payload) {
    return "Something went wrong.";
  }
  if (typeof payload === "string") {
    return payload;
  }
  if (payload.detail) {
    return payload.detail;
  }
  const firstKey = Object.keys(payload)[0];
  if (!firstKey) {
    return "Something went wrong.";
  }
  const value = payload[firstKey];
  if (Array.isArray(value)) {
    return value[0];
  }
  if (typeof value === "object") {
    return extractErrorMessage(value);
  }
  return String(value);
}

export async function apiRequest(path, options = {}) {
  const { method = "GET", body, token, headers = {} } = options;
  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  const config = {
    method,
    headers: requestHeaders,
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  if (body instanceof FormData) {
    config.body = body;
  } else if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, config);
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const error = new Error(extractErrorMessage(payload));
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export { API_BASE_URL };

