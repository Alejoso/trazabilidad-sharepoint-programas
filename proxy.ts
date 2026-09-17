import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, cookieValida } from "@/lib/auth";

export default async function proxy(req: NextRequest) {
  if (await cookieValida(req.cookies.get(COOKIE)?.value)) {
    return NextResponse.next();
  }

  const login = new URL("/login", req.url);
  if (req.nextUrl.pathname !== "/") {
    login.searchParams.set("destino", req.nextUrl.pathname + req.nextUrl.search);
  }
  return NextResponse.redirect(login);
}

export const config = {
  // Todo queda detrás de la clave menos el propio login y los estáticos.
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};
