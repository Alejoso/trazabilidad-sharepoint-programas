"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ENLACES = [
  // El detalle de un programa cuelga del listado, así que marca "Programas".
  { href: "/", texto: "Programas", activo: (p: string) => p === "/" || p.startsWith("/programa") },
  { href: "/actividad", texto: "Actividad", activo: (p: string) => p.startsWith("/actividad") },
];

export function Nav() {
  const ruta = usePathname();

  return (
    <nav className="flex items-center gap-1 text-sm">
      {ENLACES.map((e) => {
        const activo = e.activo(ruta);
        return (
          <Link
            key={e.href}
            href={e.href}
            aria-current={activo ? "page" : undefined}
            className="rounded-md px-2.5 py-1 transition-colors"
            style={
              activo
                ? {
                    color: "var(--acento)",
                    background: "var(--acento-suave)",
                    fontWeight: 500,
                  }
                : { color: "var(--texto-suave)" }
            }
          >
            {e.texto}
          </Link>
        );
      })}
    </nav>
  );
}
