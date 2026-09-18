import axios from "axios";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const t = localStorage.getItem("token");
    if (t) config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (e) => {
    // Jangan auto-redirect kalau endpoint publik (dashboard, stream)
    const url = e.config?.url ?? "";
    const isPublicEndpoint =
      url.includes("/dashboard/") ||
      url.includes("/stream/") ||
      url.includes("/menus") ||
      url.includes("/categories");

    if (
      e.response?.status === 401 &&
      typeof window !== "undefined" &&
      !isPublicEndpoint
    ) {
      localStorage.removeItem("token");
      if (!location.pathname.startsWith("/login")) {
        location.href = "/login";
      }
    }
    return Promise.reject(e);
  }
);

export function fileUrl(path: string, params: Record<string, string> = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";
  const q = new URLSearchParams({ token, ...params }).toString();
  return `${API_BASE}${path}?${q}`;
}