// // src/middleware.ts
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// export function proxy(request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   // Only protect the seller dashboard route
//   const isSellerDashboard = pathname === "/seller_7a3b9f2c/dashboard" || 
//                            pathname.startsWith("/seller_7a3b9f2c/dashboard/");

//   // Allow all other routes
//   if (!isSellerDashboard) {
//     return NextResponse.next();
//   }

//   // Check for token in cookies OR in Authorization header
//   const token = request.cookies.get("token")?.value;
//   const authHeader = request.headers.get("authorization");

//   // If token exists in either, allow access
//   if (token || authHeader) {
//     console.log("✅ Token found, allowing access to dashboard");
//     return NextResponse.next();
//   }

//   // If no token, redirect to home with login modal
//   console.log("🚫 No token found, redirecting to login");
//   const url = new URL("/", request.url);
//   url.searchParams.set("showLogin", "true");
//   url.searchParams.set("redirect", pathname);
//   return NextResponse.redirect(url);
// }

// export const config = {
//   matcher: [
//     "/seller_7a3b9f2c/dashboard",
//     "/seller_7a3b9f2c/dashboard/:path*",
//   ],
// };













import { NextRequest, NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function proxy(request: NextRequest) {
  return NextResponse.next();
}