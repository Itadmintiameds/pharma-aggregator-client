
import axios, { AxiosError } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Added for cookies/session
});

/**
 * 🔐 REQUEST INTERCEPTOR
 * Automatically attach JWT token to every request
 */
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 🚨 RESPONSE INTERCEPTOR
 * Handle global API errors
 */
// src/lib/api.ts

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized! Token may be expired.");

      // Clear all auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userId");
      localStorage.removeItem("resetEmail");
      
      // Clear cookie
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      // Redirect to home with login modal
      if (typeof window !== "undefined") {
        if (!window.location.pathname.includes("/forgot-password")) {
          window.location.href = "/?showLogin=true&session=expired";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;























// import axios from "axios";

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

//  const api = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // /**
// //  * 🔐 REQUEST INTERCEPTOR
// //  * Automatically attach JWT token to every request
// //  */
// // api.interceptors.request.use(
// //   (config) => {
// //     // Get token from localStorage
// //     const token = typeof window !== "undefined"
// //       ? localStorage.getItem("token")
// //       : null;

// //     if (token) {
// //       config.headers.Authorization = `Bearer ${token}`;
// //     }

// //     return config;
// //   },
// //   (error) => Promise.reject(error)
// // );

// // /**
// //  * 🚨 RESPONSE INTERCEPTOR
// //  * Handle global API errors
// //  */
// // api.interceptors.response.use(
// //   (response) => response,
// //   (error) => {
// //     if (error.response?.status === 401) {
// //       console.error("Unauthorized! Token may be expired.");

// //       localStorage.removeItem("token");

// //       if (typeof window !== "undefined") {
// //         window.location.href = "/login";
// //       }
// //     }

// //     console.error("API Error:", error.response?.data || error.message);
// //     return Promise.reject(error);
// //   }
// // )
//  export default api;