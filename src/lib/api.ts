import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

 const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// /**
//  * 🔐 REQUEST INTERCEPTOR
//  * Automatically attach JWT token to every request
//  */
// api.interceptors.request.use(
//   (config) => {
//     // Get token from localStorage
//     const token = typeof window !== "undefined"
//       ? localStorage.getItem("token")
//       : null;

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// /**
//  * 🚨 RESPONSE INTERCEPTOR
//  * Handle global API errors
//  */
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       console.error("Unauthorized! Token may be expired.");

//       localStorage.removeItem("token");

//       if (typeof window !== "undefined") {
//         window.location.href = "/login";
//       }
//     }

//     console.error("API Error:", error.response?.data || error.message);
//     return Promise.reject(error);
//   }
// )
 export default api;