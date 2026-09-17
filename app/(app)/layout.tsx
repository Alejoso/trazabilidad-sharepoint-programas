import Link from "next/link";
import { cerrarSesion } from "../login/actions";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header
        className="sticky top-0 z-10 border-b backdrop-blur"
        style={{
          borderColor: "var(--borde)",
          background: "color-mix(in srgb, var(--fondo) 85%, transparent)",
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Trazabilidad{" "}
            <span style={{ color: "var(--texto-suave)" }}>· programas</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/"
              className="transition-opacity hover:opacity-70"
              style={{ color: "var(--texto-suave)" }}
            >
              Programas
            </Link>
            <Link
              href="/actividad"
              className="transition-opacity hover:opacity-70"
              style={{ color: "var(--texto-suave)" }}
            >
              Actividad
            </Link>
          </nav>
          <form action={cerrarSesion} className="ml-auto">
            <button
              type="submit"
              className="cursor-pointer text-xs transition-opacity hover:opacity-70"
              style={{ color: "var(--texto-suave)" }}
            >
              Salir
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
