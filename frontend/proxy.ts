import { NextResponse, NextRequest } from "next/server";

// ═══════════════════════════════════════════════════════════
// PROXY — Next.js 16 (sebelumnya "middleware")
//
// Berjalan sebelum setiap request.
// Fungsi:
//   - Skip asset & public path
//   - Tambah security headers
// ═══════════════════════════════════════════════════════════
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ─── Public paths — skip ───
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/manifest") ||
    pathname === "/sw.js" ||
    pathname.startsWith("/favicon");

  if (isPublic) return NextResponse.next();

  // ─── Security headers untuk semua response ───
  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return res;
}

// ═══════════════════════════════════════════════════════════
// CONFIG — path yang diproses proxy
// ═══════════════════════════════════════════════════════════
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};