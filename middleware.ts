// import { clerkMiddleware } from "@clerk/nextjs/server";

// export default clerkMiddleware();

// export const config = {
//  matcher: [
//    // Skip Next.js internals and all static files, unless found in search params
//    "/((?!_next|\\.well-known|[^?]*\\.(?:html?|css|js|json|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
//     // Always run for API routes
//     '/(api|trpc)(.*)',
//   ],
// };

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher(['/', 'about']);
// const isAdminRoute = createRouteMatcher(['/inventory', '/distributions']);

export default clerkMiddleware(async (auth, req) => {


    // const isAdminUser = auth().userId === process.env.ADMIN_USER_ID;

    // if (isAdminRoute(req) && !isAdminUser) {
    //   return NextResponse.redirect(new URL('/', req.url));
    // }

    if (!isPublicRoute(req)) auth().protect();
 });

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};