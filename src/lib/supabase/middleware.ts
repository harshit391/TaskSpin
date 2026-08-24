import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function updateSession(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_AUTH_BYPASS_USER_ID) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const publicPaths = ["/auth", "/api/", "/_next", "/favicon", "/manifest"];
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
    url.pathname = next && next !== "/auth" ? next : "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
