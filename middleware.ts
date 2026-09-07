import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface PublicMetadata {
  tenantId?: string;
}

const isPublicRoute = createRouteMatcher(['/']);

export default clerkMiddleware(async (auth, req: NextRequest) => {

  const { userId, sessionClaims, protect } = await auth();

  if (!isPublicRoute(req)) {
    protect();
  }

  if (!userId) {
    return NextResponse.next();
  }

  const tenantId = sessionClaims?.tenantId as string | undefined;

  if (!tenantId && req.nextUrl.pathname !== "/registerShop") {
    return NextResponse.redirect(new URL("/registerShop", req.url));
  }

  return NextResponse.next();

});

export const config = {
  matcher: [
    // Added explicit lookups to skip both .json and manifest extensions safely
    '/((?!_next|manifest\\.json|webmanifest|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};