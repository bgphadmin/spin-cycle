import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface PublicMetadata {
  tenantId?: string;
}

const isPublicRoute = createRouteMatcher(['/']);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Always await the auth helper
  const authObj = await auth();

  if (!isPublicRoute(req)) {
    authObj.protect();
  }



  const { userId, sessionClaims } = auth();

  if (!userId) {
    return NextResponse.next();
  }

  const metadata = sessionClaims?.publicMetadata as PublicMetadata;
  const tenantId = metadata?.tenantId;

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