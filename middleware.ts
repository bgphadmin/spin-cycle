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
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};