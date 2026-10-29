import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function updateSession(request: NextRequest) {
  if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_AUTH_BYPASS_USER_ID) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims verifies the JWT locally (refreshing it if expired) instead of a
  // network round-trip to the Auth server on every request like getUser().
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims?.sub ?? null;

  const publicPaths = ["/auth", "/api/", "/_next", "/favicon", "/manifest", "/offline.html", "/sw.js"];
  const isPublic =
    request.nextUrl.pathname === "/" ||
    publicPaths.some((p) => request.nextUrl.pathname.startsWith(p));

  const isStaticAsset = /\.(svg|png|jpg|jpeg|gif|webp|ico|json|js|css)$/.test(
    request.nextUrl.pathname
  );

  if (!user && !isPublic && !isStaticAsset) {
    const url = request.nextUrl.clone();
    const returnTo = request.nextUrl.pathname + request.nextUrl.search;
    url.pathname = "/auth";
    url.searchParams.set("next", returnTo);
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname.startsWith("/auth")) {
    const next = request.nextUrl.searchParams.get("next");
    const url = request.nextUrl.clone();
    const safeNext = next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/auth");
    url.pathname = safeNext ? next : "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
