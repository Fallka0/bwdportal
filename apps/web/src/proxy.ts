import { NextResponse, type NextRequest } from "next/server";

/** Schnelle Prüfung: ohne Session-Cookie direkt zum Login. Die echte Prüfung passiert auf dem Server (requireUser). */
export function proxy(req: NextRequest) {
  if (!req.cookies.get("bwd_session")?.value) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|api|komponenten|_next|fonts|favicon|icon|apple-icon|opengraph-image|robots|manifest|.*\\.(?:png|svg|ico|woff2|txt|xml|webmanifest)$).*)"],
};
