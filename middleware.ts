import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

async function verifyTokenEdge(token: string): Promise<{ userId: string; email: string; role: string } | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signature = Uint8Array.from(atob(parts[2].replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
    const data = encoder.encode(`${parts[0]}.${parts[1]}`);

    const valid = await crypto.subtle.verify("HMAC", key, signature, data);
    if (!valid) return null;

    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return { userId: payload.userId, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

const intlMiddleware = createIntlMiddleware(routing);

const protectedPaths = ["/dashboard", "/resumes", "/settings", "/admin"];
const authPages = ["/login", "/register"];

function stripLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(`/${locale}`.length);
  }
  return pathname;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const intlResponse = intlMiddleware(request);

  const stripped = stripLocale(pathname);
  const token = request.cookies.get("careerflow_token")?.value;

  const locale = intlResponse.headers.get("x-next-intl-locale") || routing.defaultLocale;
  function localeUrl(path: string) {
    return new URL(`/${locale}${path}`, request.url);
  }

  if (authPages.some((p) => stripped.startsWith(p)) && token) {
    const payload = await verifyTokenEdge(token);
    if (payload) {
      return NextResponse.redirect(localeUrl("/dashboard"));
    }
  }

  if (protectedPaths.some((p) => stripped.startsWith(p))) {
    if (!token) {
      return NextResponse.redirect(localeUrl("/login"));
    }
    const payload = await verifyTokenEdge(token);
    if (!payload) {
      const response = NextResponse.redirect(localeUrl("/login"));
      response.cookies.delete("careerflow_token");
      return response;
    }
    if (stripped.startsWith("/admin") && payload.role !== "admin") {
      return NextResponse.redirect(localeUrl("/dashboard"));
    }
  }

  return intlResponse;
}

export const config = {
  matcher: [
    "/",
    "/(en|zh)/:path*",
    "/dashboard/:path*",
    "/resumes/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
