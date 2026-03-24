import axios, { AxiosError } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});
delete api.defaults.headers.post["Content-Type"];

// ✅ REQUEST INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token")
        : null;
 
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
 
    if (config.data instanceof FormData) {

      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    } else {
      config.headers = config.headers || {};
      config.headers["Content-Type"] = "application/json";
    }
 
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // ✅ Handle Unauthorized
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.clear();

        document.cookie =
          "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        window.location.href = "/?showLogin=true&session=expired";
      }
    }

    return Promise.reject(error);
  }
);

export default api;






// import axios, { AxiosError } from "axios";

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   withCredentials: true,
// });

// // ✅ REQUEST INTERCEPTOR
// api.interceptors.request.use(
//   (config) => {
//     const token =
//       typeof window !== "undefined"
//         ? localStorage.getItem("token")
//         : null;

//     // ✅ Attach token
//     if (token) {
//       config.headers = config.headers || {};
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     // ✅ Handle Content-Type properly
//    if (config.data instanceof FormData) {
//   config.headers = config.headers || {};

//   delete config.headers["Content-Type"];
//   delete config.headers["content-type"];


//   config.transformRequest = [(data) => data];
// } else {
//   config.headers = config.headers || {};
//   config.headers["Content-Type"] = "application/json";
// }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // ✅ RESPONSE INTERCEPTOR
// api.interceptors.response.use(
//   (response) => response,
//   async (error: AxiosError) => {
//     // ✅ Handle Unauthorized
//     if (error.response?.status === 401) {
//       if (typeof window !== "undefined") {
//         localStorage.clear();

//         document.cookie =
//           "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

//         window.location.href = "/?showLogin=true&session=expired";
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default api;









// import axios, { AxiosError } from "axios";

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
//   withCredentials: true, 
// });

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
// // src/lib/api.ts

// api.interceptors.response.use(
//   (response) => response,
//   async (error: AxiosError) => {
//     if (error.response?.status === 401) {
//       console.error("Unauthorized! Token may be expired.");

//       // Clear all auth data
//       localStorage.removeItem("token");
//       localStorage.removeItem("user");
//       localStorage.removeItem("userId");
//       localStorage.removeItem("resetEmail");
      
//       // Clear cookie
//       document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

//       // Redirect to home with login modal
//       if (typeof window !== "undefined") {
//         if (!window.location.pathname.includes("/forgot-password")) {
//           window.location.href = "/?showLogin=true&session=expired";
//         }
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;


