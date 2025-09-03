// middleware.ts
import { auth } from "./auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const protectedPath =
    nextUrl.pathname.startsWith("/admin") ||
    nextUrl.pathname.startsWith("/events/new");
  if (!isLoggedIn && protectedPath) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("callbackUrl", nextUrl.href);
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ["/admin/:path*", "/events/new"],
};
