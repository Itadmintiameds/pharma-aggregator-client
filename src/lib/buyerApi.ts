import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Dedicated axios client for the buyer domain — kept fully separate from
// src/lib/api.ts (the seller-used client) so buyer's token keys, refresh
// endpoint, and logout redirect never interact with seller's session state.
const buyerApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(buyerApi);
    }
  });
  failedQueue = [];
};

buyerApi.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("buyerAccessToken") : null;

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    } else if (config.headers) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

buyerApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (originalRequest.url?.includes("/refresh")) {
      return Promise.reject(error);
    }

    // Auth endpoints (login/signup/OTP) return 401 for invalid credentials —
    // that's a normal login failure, not an expired session, so skip the
    // force-logout redirect and let the caller's catch block show the error.
    const isAuthEndpoint =
      originalRequest.url?.includes("/buyer/authentication/login") ||
      originalRequest.url?.includes("/buyer/authentication/verify-otp") ||
      originalRequest.url?.includes("/buyer/auth/signup");
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => buyerApi(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("buyerRefreshToken");

      if (!refreshToken) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("buyerAccessToken");
          localStorage.removeItem("buyerRefreshToken");
          localStorage.removeItem("buyerTokenExpiresAt");
          localStorage.removeItem("buyerUser");
          document.cookie = "buyerToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          window.location.href = "/buyer_e8d45a1b/login?session=expired";
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/buyer/authentication/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem("buyerAccessToken", accessToken);
        localStorage.setItem("buyerRefreshToken", newRefreshToken);
        document.cookie = `buyerToken=${accessToken}; path=/; max-age=${24 * 60 * 60}`;

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue();

        return buyerApi(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);

        if (typeof window !== "undefined") {
          localStorage.removeItem("buyerAccessToken");
          localStorage.removeItem("buyerRefreshToken");
          localStorage.removeItem("buyerTokenExpiresAt");
          localStorage.removeItem("buyerUser");
          document.cookie = "buyerToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          window.location.href = "/buyer_e8d45a1b/login?session=expired";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default buyerApi;
