import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check maintenance mode
  if (
    !pathname.startsWith('/maintenance') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/api') &&
    !pathname.match(/\.(.*)$/)
  ) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/system_settings?select=admin_maintenance&limit=1`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          },
          cache: 'no-store', // Bypass data cache for immediate status evaluation
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0 && data[0].admin_maintenance === true) {
          return NextResponse.redirect(new URL('/maintenance', request.url));
        }
      }
    } catch (e) {
      console.error('Admin Panel maintenance check failed:', e);
    }
  }

  const isDashboard = pathname.startsWith("/dashboard");
  const authCookie = request.cookies.get("admin_auth");

  if (isDashboard && !authCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect root to dashboard (which will then check auth)
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Prevent logged-in users from seeing login pages
  const isAuthPage = pathname === "/login" || pathname === "/two-factor";
  if (isAuthPage && authCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
