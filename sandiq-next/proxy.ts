import { NextResponse, type NextRequest } from "next/server";

/**
 * The original ASP.NET MVC routes were case-insensitive and allowed the default
 * "Index" action and "Home" controller to be spelled out (e.g. /Product/Details/5,
 * /Cart/Index, /Home/Index). Next.js routes are lowercase, so incoming paths are
 * normalised here with a rewrite (the address bar keeps what the user typed).
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  let normalized = pathname.toLowerCase();
  if (normalized.length > 1 && normalized.endsWith("/")) normalized = normalized.slice(0, -1);
  if (normalized.endsWith("/index")) normalized = normalized.slice(0, -"/index".length) || "/";
  if (normalized === "/home") normalized = "/";
  if (normalized === "/admin/home") normalized = "/admin";

  const requestHeaders = new Headers(request.headers);
  // Used as ReturnUrl when an anonymous user hits a protected page.
  requestHeaders.set("x-sandiq-path", pathname + search);

  if (normalized !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = normalized;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/|api/|uploads/|assets/|favicon\\.ico).*)"],
};
