
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Track refresh state
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(api);
    }
  });
  failedQueue = [];
};

// Request interceptor - Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Handle FormData
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

// Response interceptor - Handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Don't retry refresh endpoint
    if (originalRequest.url?.includes('/refresh')) {
      return Promise.reject(error);
    }
    
    // If 401 and not retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = localStorage.getItem("refreshToken");
      
      if (!refreshToken) {
        // No refresh token, force logout
        if (typeof window !== "undefined") {
          localStorage.clear();
          document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          window.location.href = "/?showLogin=true&session=expired";
        }
        return Promise.reject(error);
      }
      
      try {
        // Call refresh endpoint
        const response = await axios.post(`${API_BASE_URL}/authentication/refresh`, {
          refreshToken: refreshToken
        });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Store new tokens
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        
        // Update cookie for middleware
        document.cookie = `token=${accessToken}; path=/; max-age=${24 * 60 * 60}`;
        
        // Update authorization header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        // Process queued requests
        processQueue();
        
        // Retry original request
        return api(originalRequest);
        
      } catch (refreshError) {
        // Refresh failed - clear everything and redirect to login
        processQueue(refreshError);
        
        if (typeof window !== "undefined") {
          localStorage.clear();
          sessionStorage.clear();
          document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          window.location.href = "/?showLogin=true&session=expired";
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Handle other 401 errors
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.clear();
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        window.location.href = "/?showLogin=true&session=expired";
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;








// old code without response token ........

// import axios, { AxiosError } from "axios";

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   withCredentials: true,
// });
// delete api.defaults.headers.post["Content-Type"];

// // ✅ REQUEST INTERCEPTOR
// api.interceptors.request.use(
//   (config) => {
//     const token =
//       typeof window !== "undefined"
//         ? localStorage.getItem("token")
//         : null;
 
//     if (token) {
//       config.headers = config.headers || {};
//       config.headers.Authorization = `Bearer ${token}`;
//     }
 
//     if (config.data instanceof FormData) {

//       delete config.headers["Content-Type"];
//       delete config.headers["content-type"];
//     } else {
//       config.headers = config.headers || {};
//       config.headers["Content-Type"] = "application/json";
//     }
 
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