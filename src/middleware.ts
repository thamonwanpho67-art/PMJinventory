import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  try {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;
    const isAuthPage = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");

    console.log("Middleware - Path:", nextUrl.pathname, "Logged in:", isLoggedIn);

    // Allow public assets and API routes
    if (
      nextUrl.pathname.startsWith("/api/auth") ||
      nextUrl.pathname.startsWith("/_next") ||
      nextUrl.pathname.startsWith("/favicon.ico") ||
      nextUrl.pathname.startsWith("/images") ||
      nextUrl.pathname.includes(".")
    ) {
      return NextResponse.next();
    }

    // Handle root path redirect
    if (nextUrl.pathname === "/") {
      if (isLoggedIn) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
      } else {
        return NextResponse.redirect(new URL("/login", nextUrl));
      }
    }

    // Redirect to login if not authenticated and not on auth page
    if (!isLoggedIn && !isAuthPage) {
      let from = nextUrl.pathname;
      if (nextUrl.search) {
        from += nextUrl.search;
      }
      console.log("Middleware - Redirecting to login from:", from);
      return NextResponse.redirect(
        new URL(`/login?from=${encodeURIComponent(from)}`, nextUrl)
      );
    }

    // Redirect authenticated users from auth pages to dashboard
    if (isLoggedIn && isAuthPage) {
      console.log("Middleware - Redirecting authenticated user to dashboard");
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    // Handle role-based access
    if (isLoggedIn && req.auth?.user) {
      const role = req.auth.user.role;
      const path = nextUrl.pathname;

      console.log("Middleware - User role:", role, "Path:", path);

      // Admin routes protection
      if (path.startsWith("/admin") && role !== "ADMIN") {
        console.log("Middleware - Non-admin trying to access admin route");
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // In case of middleware error, redirect to login to be safe
    if (!req.nextUrl.pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
    return NextResponse.next();
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)", "/"],
};
