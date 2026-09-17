"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, tokenDeSesion } from "@/lib/auth";

/** Sólo permitimos volver a rutas internas, para no convertirlo en redirector abierto. */
function destinoSeguro(valor: FormDataEntryValue | null) {
  const s = typeof valor === "string" ? valor : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
}

export async function entrar(datos: FormData) {
  const esperada = process.env.APP_PASSWORD;
  const destino = destinoSeguro(datos.get("destino"));

  // El error viaja por la URL en vez de por estado de cliente: así el login
  // funciona igual sin JavaScript.
  const volver = (error: string) => {
    const p = new URLSearchParams({ error });
    if (destino !== "/") p.set("destino", destino);
    redirect(`/login?${p}`);
  };

  if (!esperada) volver("config");
  if (String(datos.get("password") ?? "") !== esperada) volver("clave");

  (await cookies()).set(COOKIE, await tokenDeSesion(esperada!), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(destino);
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE);
  redirect("/login");
}
