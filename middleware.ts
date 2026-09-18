import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    auth().protect()
  }

  const { sessionClaims } = auth();
  const { orgRole, orgSlug } = (sessionClaims ?? {}) as {
    orgRole?: string;
    orgSlug?: string;
  };

  let pathname = req.nextUrl.pathname;
  if (orgRole === "org:admin" && orgSlug) {
    const tenantId = sessionClaims?.tenantId as string | undefined;

    if (pathname !== "/registerShop" && !tenantId) {
      return NextResponse.redirect(new URL("/registerShop", req.url));
    } else if (pathname === "/registerShop" && tenantId) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  } else if (pathname === "/registerShop" && orgRole === "org:member") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  const path = req.nextUrl.pathname;
  if (path.includes("/machines/") && path.endsWith("/edit") && (orgRole !== "org:admin")) {
    return NextResponse.redirect(new URL("/not-allowed", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files and _next internals, but still
    // run for well-known paths (e.g. Chrome DevTools' automatic request to
    // /.well-known/appspecific/com.chrome.devtools.json) so ClerkProvider's
    // server-side auth() call always has middleware context, even on 404s.
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
    "/.well-known/(.*)",
  ],
};