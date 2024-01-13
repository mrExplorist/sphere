// The middleware function is called for every request. You can use the NextRequest and NextResponse objects to inspect and modify the incoming request and outgoing response. The middleware function must return a NextResponse object.

// Middleware will be invoked for every route in your project, unless you specify a route pattern in the middleware config.

import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  const emailLinkError = "Email link is invalid or has expired";
  if (
    req.nextUrl.searchParams.get("error_description") === emailLinkError &&
    req.nextUrl.pathname !== "/signup"
  ) {
    return NextResponse.redirect(
      new URL(
        `/signup?error_description=${req.nextUrl.searchParams.get(
          "error_description",
        )}`,
        req.url,
      ),
    );
  }

  if (["/login", "/signup"].includes(req.nextUrl.pathname)) {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }
  return res;
}
