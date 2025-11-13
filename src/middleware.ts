import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  // Security headers
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("Permissions-Policy", "camera=(self), microphone=(self)");
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  // Basic CSRF protection for API mutations: enforce same-origin
  if (req.nextUrl.pathname.startsWith("/api") && ["POST","PUT","PATCH","DELETE"].includes(req.method)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && !origin.includes(host || "")) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    return res;
  }

  // Route protection: require biometric after login
  const path = req.nextUrl.pathname;
  const allowed = path.startsWith("/auth") || path.startsWith("/biometric") || path.startsWith("/_next") || path === "/favicon.ico";
  if (allowed) return res;
  const hasRefresh = !!req.cookies.get("refresh_token")?.value;
  if (!hasRefresh) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }
  const hasBio = !!req.cookies.get("bio_ok")?.value;
  if (!hasBio) {
    return NextResponse.redirect(new URL("/biometric", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
